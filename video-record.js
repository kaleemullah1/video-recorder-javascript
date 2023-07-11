/*********** Video Recording Project JS ***********/

window.onload = (event) => {
    var preview = document.getElementById("previewVideo");
    var recording = document.getElementById("recordedVideo");
    var startButton = document.getElementById("record_btn");
    var startButtonDisabled = document.getElementById("record_btn_disabled");
    var playButton = document.getElementById("play_btn_active");
    var playButtonDisabled = document.getElementById("play_btn_disabled");
    var stopButton = document.getElementById("stop_btn");
    var pauseButton = document.getElementById("pause_btn");
    var errorContDefault = document.getElementById('video_error');
    window.stream = '';
    var recordedBlobVideo = '';

    var recordingTimeCounter = 0;
    var recordingTimeMaxSeconds = 60;// 1 minutes
    var intervalId;
    var playIntervalId;
    var sec = 0;
    var min = 0;
    var recording_time = document.getElementById('recording_time');

    var video_load_required_modal = true;
    var video_load_required_vm_listing = true;
    var video_image_url = '';
    var vm_listing_page_no = 1;
    var vm_modal_page_no = 1;
    var video_manager_listing = false;

    function defaultCameraOpenState() {
        recordedBlobVideo = '';
        defaultSettings();
        var streamPromis = new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    frameRate: { ideal: 10 }
                },//{facingMode: "user"},
                audio: true
            }).then(stream => {
                window.stream = stream
                preview.srcObject = stream;
                preview.captureStream = preview.captureStream || preview.mozCaptureStream;
                startButton.style.display = 'inline-block';
                startButtonDisabled.style.display = 'none';
                return new Promise(resolve => preview.onplaying = resolve);
            }).catch(function (reason) {
                console.log(reason);
                errorContDefault.style.display = 'block';
                errorContDefault.innerHTML = reason;
                defaultSettings();
            });
        });
    }



    startButton.addEventListener("click", function (e) {
        e.preventDefault();
        window.stream = '';
        navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 320 },
                height: { ideal: 240 },
                frameRate: { ideal: 10 }
            },//{ facingMode: "user"},
            audio: true
        }).then(stream => {
            window.stream = stream
            preview.srcObject = stream;
            startRecordingButtonsSettings();
            preview.captureStream = preview.captureStream || preview.mozCaptureStream;
            preview.style.display = 'block';
            recording.style.display = 'none';
            recording.pause();
            recording.removeAttribute('src');
            clearInterval(playIntervalId);
            recording_time.innerHTML = '00:00';
            return new Promise(resolve => preview.onplaying = resolve);
        }).then(() => awaitReady())
            .then(() => startRecording(preview.srcObject))
            .then(recordedChunks => {
                let recordedBlob = new Blob(recordedChunks, { type: "video/mp4;codecs=H264" });
                recordedBlobVideo = recordedBlob;
                recording.src = URL.createObjectURL(recordedBlob);
                recording.style.display = 'block';
                preview.style.display = 'none';
                startButton.style.display = 'inline-block';
                stopButton.style.display = 'none';
                playButtonDisabled.style.display = 'none';
                playButton.style.display = 'inline-block';
                //fix for iphone preview
                recording.play();
                setTimeout(function () {
                    recording.pause();
                }, 500);
                //end
                //log("Successfully recorded " + recordedBlob.size +" bytes of " + recordedBlob.type +" media.");
                getRecordedVideoDetail();
            })
            .catch(function (reason) {
                console.log(reason);
                errorContDefault.style.display = 'block';
                errorContDefault.innerHTML = reason;
                defaultSettings();
            });
    }, false);

    function startRecording(stream) {


        let recorder = new MediaRecorder(stream);
        window.recorder = recorder;
        let data = [];
        recorder.ondataavailable = event => data.push(event.data);
        recorder.start();
        startButton.style.display = 'none';
        startButtonDisabled.style.display = 'none';
        stopButton.style.display = 'inline-block';
        startRecordingMinutes();
        //log(recorder.state + " for " + (lengthInMS/1000) + " seconds...");

        let stopped = new Promise((resolve, reject) => {
            recorder.onstop = resolve;
            recorder.onerror = event => reject(event.name);
        });

        return Promise.all([
            stopped
        ]).then(() => data);
    }

    stopButton.addEventListener("click", function (e) {
        e.preventDefault();
        window.recorder.stop();
        stopVideoStream(window.stream);
    }, false);

    function stopVideoStream(stream) {
        stopRecordingMinutes();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream.getTracks().forEach(function (track) {
                track.stop()
            });
        }
    }

    playButton.addEventListener("click", function (e) {
        e.preventDefault();
        recording.play();
        playButton.style.display = 'none';
        pauseButton.style.display = 'inline-block';
        playIntervalId = setInterval(function () {
            timerCycle();
        }, 1000);
    });
    pauseButton.addEventListener("click", function (e) {
        e.preventDefault();
        recording.pause();
    });

    recording.addEventListener('ended', (event) => {
        playButton.style.display = 'inline-block';
        pauseButton.style.display = 'none';
        sec = 0; min = 0;
        recording_time.innerHTML = '00:00';
        clearInterval(playIntervalId);
    });

    recording.addEventListener('pause', (event) => {
        playButton.style.display = 'inline-block';
        pauseButton.style.display = 'none';
        clearInterval(playIntervalId);
    });

    function startRecordingMinutes() {
        recordingTimeCounter = 0; sec = 0; min = 0;
        intervalId = window.setInterval(function () {
            timerCycle();
            recordingTimeCounter++;
            if (recordingTimeCounter >= recordingTimeMaxSeconds) {
                /*clearInterval(intervalId);
                stopVideoStream(window.stream);
                window.recorder.stop();*/
                stopButton.click();
            }
        }, 1000);
    }

    function stopRecordingMinutes() {
        clearInterval(intervalId);
        sec = 0; min = 0;
        recording_time.innerHTML = '00:00';
    }

    function timerCycle() {
        sec = parseInt(sec);
        min = parseInt(min);
        sec = sec + 1;
        if (sec == 60) {
            min = min + 1;
            sec = 0;
        }
        if (sec < 10 || sec == 0) {
            sec = '0' + sec;
        }
        if (min < 10 || min == 0) {
            min = '0' + min;
        }
        recording_time.innerHTML = min + ':' + sec;
    }

    function awaitReady() {
        let countdownCont = document.getElementById('overlay');   // declaring varialble for countdown container
        let promiswait = new Promise(function (resolve, reject) {
            let counter = 4;
            countdownCont.style.display = 'block';
            let readyInterval = setInterval(function () {
                counter--;
                console.log(counter);
                timer = document.getElementById('timer');
                timer.innerHTML = counter;
                if (counter <= 0) {
                    timer.innerHTML = "";
                    countdownCont.style.display = 'none';
                    resolve();
                    clearInterval(readyInterval);
                }
            }, 1000);
        });
        var complete = async () => await promiswait;
        return complete();
    }

    function defaultSettings() {
        defaultButtonsSetting();
        preview.style.display = 'block';
        recording.style.display = 'none';
        recording.removeAttribute('src');
        stopRecordingMinutes();
    }
    function defaultButtonsSetting() {
        startButtonDisabled.style.display = 'inline-block';
        startButton.style.display = 'none';
        playButtonDisabled.style.display = 'inline-block';
        playButton.style.display = 'none';
        pauseButton.style.display = 'none';
        stopButton.style.display = 'none';
    }
    function startRecordingButtonsSettings() {
        playButtonDisabled.style.display = 'inline-block';
        startButtonDisabled.style.display = 'inline-block';
        startButton.style.display = 'none';
        playButton.style.display = 'none';
        pauseButton.style.display = 'none';
    }

    // function for re rcording confirmation popup
    function openConfirmationPopup() {
        document.getElementById('re_recording_confirm_popup').style.display = 'block';
    }

    function getRecordedVideoDetail() {
        //send blob to server in form data
        var blob = recordedBlobVideo;
        if (blob == '') {
            errorContDefault.style.display = 'block';
            errorContDefault.innerHTML = "Video source is not valid!";
        }
        var size = parseInt(blob.size / 1000000);
        console.log('Video Size in MB : ' + size);
        document.getElementById('video_size').innerHTML = blob.size;
    }

    //call this function from where you want to get camera and mic access
    defaultCameraOpenState();

};


