const LZString = require('./LZStringLib.js');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');

// installed version of the ffmpeg utility, this module is just an npm wrapper around that
//const ffmpeg = require('ffmpeg');

// emscriptem version of ffmpeg, cf https://github.com/PaulKinlan/ffmpeg.js/tree/wasm, with mp3 support
//const ffmpeg = require("ffmpeg.js/ffmpeg-mp4.js")
const ffmpeg = require("ffmpeg.js")
const speech = require('@google-cloud/speech');

const port = process.env.PORT || 30001;

// This will be used to kill the npm process (package.json stop script)
process.title = "uploader";

app.use(express.static(path.join(__dirname, '../client')));
// For ajax post requests
app.use(bodyParser.json());

async function sendFlacToGoogle(filePath) {
  // Creates a google speech client
  const client = new speech.SpeechClient();

  const base64Audio = fs.readFileSync(filePath).toString('base64');
  const config = {
    //    encoding: 'OGG_OPUS',
    encoding: 'FLAC',
    sampleRateHertz: 48000,
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

async function sendOpusToGoogle(filePath) {
  // Creates a google speech client
  const client = new speech.SpeechClient();

  const base64Audio = fs.readFileSync(filePath).toString('base64');
  const config = {
    //    encoding: 'OGG_OPUS',
    encoding: 'OGG_OPUS',
    sampleRateHertz: 48000,
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
  //console.log('Sending this to google:', request);
  const [response] = await client.recognize(request);
  const transcriptions = response.results
                                .map(result => result.alternatives[0]);
  console.log('Full results:', transcriptions);
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
      // console.log('Server got file:', file);
      // Do something with uploaded file
      const audioData = new Uint8Array(fs.readFileSync(file.path));
      const audioFileName = path.basename(file.path);
      const opusFileName = audioFileName + '.opus';
      // Encode test video to VP8. Details: https://github.com/PaulKinlan/ffmpeg.js/tree/wasm
      let stdout = '';
      let stderr = '';
      const result = ffmpeg({
        MEMFS: [{name: audioFileName, data: audioData}],
        arguments: ["-i", audioFileName, "-ac", "1", "-acodec", "opus", opusFileName],
        print: function(data) { stdout += data + "\n"; },
        printErr: function(data) { stderr += data + "\n"; },
        // Ignore stdin read requests.
        stdin: function() {},
      });
      // Write out opus file to disk.
      const out = result.MEMFS[0];
      const opusFilePath = 'data/' + out.name;
      fs.writeFileSync(opusFilePath, Buffer(out.data));
      sendOpusToGoogle(opusFilePath);
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
