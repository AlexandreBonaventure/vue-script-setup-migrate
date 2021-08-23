<script lang="ts">
import TestComponent from './TestComponent.vue';
export default {
  components: {
    TestComponent
  },
  props: {
    msg: {
      type: String,
      required: true
    }
  },
  inheritAttrs: false
};
</script>
<script lang="ts" setup>
const computedMsg = computed(() => props.msg + 'bar');
</script>
<template>
  <div>
    {{ msg }}
    {{ computedMsg }}
  </div>
</template>
<style scoped>
  div {
    color: red;
  }
</style>