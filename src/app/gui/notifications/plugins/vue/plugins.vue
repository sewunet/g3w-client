<template functional>
  <div id="plugins_notification" v-plugins style="color: #994b10">
    <bar-loader loading="true"></bar-loader>
    <i :class="g3wtemplate.getFontClass('plugin')"></i>
  </div>
</template>

<script>
  export default {
    name: 'plugins-notify',
  }

</script>

<style>

</style>
