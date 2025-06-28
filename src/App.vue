<script setup>
import { ref, provide } from 'vue'

const layoutRef = ref(null)
provide('layoutRef', layoutRef)
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" ref="layoutRef" />
  </router-view>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

#app {
  height: 100vh;
}
</style>
