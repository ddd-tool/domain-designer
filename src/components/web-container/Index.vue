<script setup lang="ts">
import '@xterm/xterm/css/xterm.css'
import { onMounted, ref } from 'vue'
import { useWebContainerAgg } from '#domain/web-container-agg'
import demoFiles from './demo-files'
import { Terminal } from '@xterm/xterm'

const webContainerAgg = useWebContainerAgg()
const terminal = new Terminal({
  convertEol: true,
})

const iframeRef = ref()
const textareaRef = ref()
const terminalRef = ref()
const loading = ref(true)
onMounted(() => {
  webContainerAgg.commands.bindTextarea(textareaRef.value!)
  webContainerAgg.commands.bindIframe(iframeRef.value!)
  webContainerAgg.commands.mountFiles(demoFiles)
  terminal.resize(120, 13)
  terminal.open(terminalRef.value!)
})

webContainerAgg.events.onProjectMounted.watchPublish(async () => {
  loading.value = false
  console.debug('开始安装依赖')
  const installProcess = await webContainerAgg.commands.installDeps()
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data)
      },
    })
  )
  console.debug('安装依赖结果', await installProcess.exit)
  if ((await installProcess.exit) !== 0) {
    return
  }
  const runProcess = await webContainerAgg.commands.runDev()
  runProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data)
      },
    })
  )
})
</script>

<template>
  <div class="loading" v-show="loading">
    <h1>Loading...</h1>
  </div>
  <div class="container">
    <div class="editor">
      <textarea ref="textareaRef"></textarea>
    </div>
    <div class="preview">
      <iframe ref="iframeRef"></iframe>
    </div>
    <div ref="terminalRef" class="tarminal"></div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
.loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
}

.container {
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-template-rows: 3fr 1fr;
  gap: 1rem;
  height: 100%;
  width: 100%;
}

textarea {
  width: 100%;
  height: 100%;
  resize: none;
  border-radius: 0.5rem;
  background: black;
  color: white;
  padding: 0.5rem 1rem;
}

iframe {
  height: 100%;
  width: 100%;
  border-radius: 0.5rem;
}

.tarminal {
  grid-column: 1 / 3;
  overflow-y: hidden;
}

code {
  display: block;
  background-color: #000;
  color: #fff;
  width: 100%;
  height: auto;
}
</style>
