const LZString = require('./LZStringLib.js');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('ffmpeg');
const speech = require('@google-cloud/speech');

const port = process.env.PORT || 30001;


// This will be used to kill the npm process (package.json stop script)
process.title = "uploader";

app.use(express.static(path.join(__dirname, '../client')));
// For ajax post requests
app.use(bodyParser.json());

async function sendToGoogle(filePath) {
  // Creates a google speech client
  const client = new speech.SpeechClient();

  const base64Audio = fs.readFileSync(filePath).toString('base64');
  const config = {
    //    encoding: 'OGG_OPUS',
//    encoding: 'OGG_OPUS',
    encoding: 'FLAC',
//    sampleRateHertz: 4000,
    languageCode: 'en-US',
  };
  const audio = {
    content: base64Audio
  };
  const request = {
    config: config,
    audio: audio,
  };

  // Detects speech in the audio file
  console.log('Sending this to google:', request);
  const [response] = await client.recognize(request);
  const transcription = response.results
                                .map(result => result.alternatives[0].transcript)
                                .join('\n');
  console.log(`Transcription: ${transcription}`);
}


app
  .post('/upload', async function (req, res) {
    const form = new formidable.IncomingForm();
    form.uploadDir = __dirname + '/data';
    form.encoding = 'binary';

    form.addListener('file', function(name, file) {
      // do something with uploaded file
      console.log('got file.path:', file.path);
      const process = new ffmpeg(file.path);
      process.then((audio) => {
        //console.log('got audio.', audio);
        audio.fnExtractSoundToMP3(__dirname + '/data/out.mp3', (error, file) => {
          if (!error) {
            console.log('Audio file:', file);
          } else {
            console.log('Got error in fnExtractSoundToMP3:', error);
          }
        });
      }, (error) => {
        console.log('Error:', error);
      });
      sendToGoogle('data/out.flac');
    });

    form.addListener('end', function() {
      res.end();
    });

    form.parse(req, function(err, fields, files) {
      if (err) {
        console.log(err);
      }
    });
  });

app.listen(port, () => {
  console.log('Server listening at port %d', port);
});
