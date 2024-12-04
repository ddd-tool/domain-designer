import { createBroadcastEvent, createSingletonAgg } from 'vue-fn/domain'
import { WebContainer } from '@webcontainer/api'
import { ref, watch } from 'vue'

export type File = {
  file: {
    contents: string
  }
}
export type Directory = {
  directory: {
    [name: string]: File | Directory
  }
}
export type ProjectFiles = {
  [name: string]: File | Directory
}

const agg = createSingletonAgg((context) => {
  let webcontainerInstance: WebContainer
  let textareaInstance: HTMLTextAreaElement | undefined
  let code = ref('')
  watch(code, (v) => {
    if (!textareaInstance) {
      return
    }
    console.debug('update code')
    textareaInstance.value = v
  })
  context.onBeforeInitialize(async () => {
    const instance = await WebContainer.boot()
    webcontainerInstance = instance
  })
  const onProjectMounted = createBroadcastEvent({})

  return {
    events: {
      onProjectMounted,
    },
    states: {},
    commands: {
      async mountFiles(projectFiles: ProjectFiles) {
        await context.untilInitialized
        webcontainerInstance.mount(projectFiles)
        code.value = await webcontainerInstance.fs.readFile('index.js', 'utf-8')
        onProjectMounted.publish({})
      },
      async bindIframe(iframeRef: HTMLIFrameElement) {
        await context.untilInitialized
        webcontainerInstance.on('server-ready', (_port, url) => (iframeRef.src = url))
      },
      async bindTextarea(el: HTMLTextAreaElement) {
        await context.untilInitialized
        textareaInstance = el
      },
      async installDeps() {
        await context.untilInitialized
        const process = await webcontainerInstance.spawn('npm', ['install'])
        return process
      },
      async runDev() {
        await context.untilInitialized
        const process = await webcontainerInstance.spawn('npm', ['run', 'start'])
        return process
      },
    },
  }
})

export function useWebContainerAgg() {
  return agg.api
}
