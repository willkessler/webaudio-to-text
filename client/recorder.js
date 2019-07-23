// https://codepen.io/jeremyagottfried/pen/bMqyNZ
navigator.mediaDevices.getUserMedia({audio:true})
         .then(stream => {handlerFunction(stream)})

let rec;

function handlerFunction(stream) {
  rec = new MediaRecorder(stream);
  rec.ondataavailable = e => {
    audioChunks.push(e.data);
    if (rec.state == "inactive") {
      let blob = new Blob(audioChunks,{type:'audio/mpeg-3'});
      recordedAudio.src = URL.createObjectURL(blob);
      recordedAudio.controls=true;
      recordedAudio.autoplay=true;

      sendDataViaForm(blob);

      if (false) {
        const reader = new window.FileReader();
        // https://stackoverflow.com/questions/41475746/converting-mediarecorder-audio-to-base64
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const result = reader.result;
          const base64 = result.split(',')[1];
          console.log(base64);
          const thing = {
            fileName: 'test1',
            audioData: base64,
          };
          console.log(thing);
          console.log(sendData(thing));
        }
      }
    }
  }
}

function sendDataViaForm(blob) {
  const formData = new FormData();
  //formData.append('fileName', 'audio.mp3');
  //formData.append('audioData', blob, 'audio.mp3');
  
  const xhr = new XMLHttpRequest();

  const onProgress = function(e) {
    if (e.lengthComputable) {
      var percentComplete = (e.loaded/e.total)*100;
    }
  };

  const onReady = function(e) {
    // ready state
  };

  const onError = function(err) {
    // something went wrong with upload
  };

  formData.append('files', blob);
  xhr.open('post', '/upload', true);
  xhr.addEventListener('error', onError, false);
  xhr.addEventListener('progress', onProgress, false);
  xhr.send(formData);
  xhr.addEventListener('readystatechange', onReady, false);

/*
  const xhr = new XMLHttpRequest();
  xhr.open("POST", '/upload', true);

  //Send the proper header information along with the request
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  xhr.onreadystatechange = function() { // Call a function when the state changes.
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      // Request finished. Do processing here.
      console.log('Finished upload of audio.');
    }
  }
  xhr.send(formData);
  */
}

function sendData(data) {
  console.log('Sending data', data);
  fetch('upload', {
    method: "POST",
    mode: "cors",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    referrer: "no-referrer",
    cache: 'no-cache',
    body: JSON.stringify(data)
  }).then((response) => {
    return response.json();
  }).then((myJson) => {
    console.log(myJson);
  });
}

record.onclick = e => {
  console.log('I was clicked')
  record.disabled = true;
  record.style.backgroundColor = "blue"
  stopRecord.disabled=false;
  audioChunks = [];
  rec.start();
}
stopRecord.onclick = e => {
  console.log("I was clicked")
  record.disabled = false;
  stop.disabled=true;
  record.style.backgroundColor = "red"
  rec.stop();
}
