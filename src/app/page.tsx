import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>web-sampler</h1>
      <div><i>a simple 16 pad sampler</i></div>

      <div className={styles.device}>
        <div className={styles.flex}>
          <div className={styles.pad}>
            <div className={styles.title}>
              <b>Sampler</b>
              <button>Edit</button>
            </div>
            <div className={styles.buttons}>
              {[...Array(16)].map((_, i) => i).map((index: number) => {
                return (
                  <button key={index} className={styles.button}></button>
                )
              })}
            </div>
          </div>
          <div className={styles.options}>
            <div className={styles.title}>
              <p>file name</p>
            </div>
            <div className={styles.waveform}>
              <canvas width={0} height={0}></canvas>
            </div>
            <div className={styles.knobs}></div>
          </div>
        </div>
      </div>
    </main>
  )
}
