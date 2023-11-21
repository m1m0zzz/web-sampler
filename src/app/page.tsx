"use client"
import { useRef, useState } from 'react';
import styles from './page.module.css';
import { FiUpload } from 'react-icons/fi';

export default function Home() {
  const PAD_NUM = 16;
  const canvasRef = useRef(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [editable, setEditable] = useState(false);
  const [lastClicked, setLastClicked] = useState(PAD_NUM / 4 * 3);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [audioBuffers, setAudioBuffers] = useState<AudioBuffer[]>([]);

  const handleFile = async (files: FileList | null, index: number) => {
    if (files && files[0]) {
      const newFiles = audioFiles;
      newFiles[index] = files[0];
      setAudioFiles([...newFiles]);

      // load audio
      let _audioContext: AudioContext;
      if (!audioContext) {
        _audioContext = new AudioContext();
        setAudioContext(_audioContext);
      } else {
        _audioContext = audioContext;
      }
      const audioBuf = await loadSample(_audioContext, URL.createObjectURL(files[0]));
      console.log(audioBuf);
      const newAudioBuffers = audioBuffers;
      newAudioBuffers[index] = audioBuf;
      setAudioBuffers([...newAudioBuffers]);

      draw(audioBuf);
    }
  }

  const play = (audioContext: AudioContext, index: number) => {
    if (audioBuffers[index]) {
      const src = new AudioBufferSourceNode(audioContext, { buffer: audioBuffers[index] });
      src.connect(audioContext.destination);
      src.start();
    }
  }

  const loadSample = (audioCtx: AudioContext, url: string) => {
    return new Promise<AudioBuffer>((resolve) => {
      fetch(url).then((response)=>{
          return response.arrayBuffer();
      }).then((arraybuf)=>{
          return audioCtx.decodeAudioData(arraybuf);
      }).then((buf)=>{
        resolve(buf);
      })
    });
  }

  // ref: https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/
  const filterData = (audioBuffer: AudioBuffer, samples: number) => {
    const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
    const _samples = Math.min(rawData.length, samples); // Number of samples we want to have in our final data set
    console.log("data length", rawData.length);
    const blockSize = Math.floor(rawData.length / _samples); // Number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < _samples; i++) {
      filteredData.push(rawData[i * blockSize]);
    }
    return filteredData;
  }

  const normalizeData = (filteredData: number[]) => {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map(n => n * multiplier);
  }

  const draw = (audioBuffer?: AudioBuffer) => {
    if (!canvasRef) return;
    const canvas = canvasRef.current as unknown as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const dpr = window.devicePixelRatio || 1;
    console.log(canvas.offsetWidth, canvas.offsetHeight);
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.translate(0, canvas.offsetHeight / 2); // Set Y = 0 to be in the middle of the canvas

    if (!audioBuffer) return;
    const normalizedData = normalizeData(filterData(audioBuffer, canvas.offsetWidth))

    // draw the line segments
    const width = canvas.offsetWidth / normalizedData.length;
    for (let i = 0; i < normalizedData.length; i++) {
      const x = width * i;
      const height = normalizedData[i] * canvas.offsetHeight;
      ctx.lineWidth = 1; // how thick the line is
      ctx.strokeStyle = "#FFB532"; // what color our line is
      ctx.beginPath();
      const y = ((i + 1) % 2) ? height : -height;
      console.log(x, y);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, Math.round(y));
      ctx.stroke();
    }
  };

  return (
    <main className={styles.main}>
      <h1>web-sampler</h1>
      <div><i>a simple 16 pad sampler</i></div>

      <div className={styles.device}>
        <div className={styles.flex}>
          <div className={styles.pad}>
            <div className={styles.title}>
              <b>Sampler</b>
              <button
                onClick={() => setEditable(!editable)}
              >{editable ? "play" : "edit"}</button>
            </div>
            <div className={styles.buttons}>
              {[...Array(PAD_NUM)].map((_, i) => i).map((index: number) => {
                return (
                  <button key={index} className={styles.button}
                    onClick={() => {
                      setLastClicked(index);
                      if (audioContext && !editable) {
                        play(audioContext, index);
                        draw(audioBuffers[index]);
                      }
                    }}
                  >
                    {editable ?
                    <label>
                      <input
                        type="file" accept="audio/*" style={{display: "none"}}
                        onChange={(e) => handleFile(e.target.files, index)}
                      />
                      <FiUpload style={{width: "40%" , height: "40%"}} />
                      {/* TODO: svgをクリックしないとinputが発火しない */}
                    </label> :
                    <p className={styles.filename}>{((audioFiles[index] && audioFiles[index].name) || "-")}</p>}
                  </button>
                )
              })}
            </div>
          </div>
          <div className={styles.options}>
            <p className={styles.options_title}>
              {(audioFiles[lastClicked] && audioFiles[lastClicked].name) || "Sampler"}
            </p>
            <div className={styles.waveform}>
              <canvas ref={canvasRef} className={styles.canvas} width={0} height={0}></canvas>
            </div>
            <div className={styles.knobs}></div>
          </div>
        </div>
      </div>
    </main>
  )
}
