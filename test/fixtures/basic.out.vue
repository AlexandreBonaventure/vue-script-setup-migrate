<script lang="ts">
export default {
  inheritAttrs: false
};
</script>
<script lang="ts" setup>
import { computed } from 'vue';
import TestComponent from './TestComponent.vue';
const props = defineProps({
  msg: {
    type: String,
    required: true
  }
});
const emit = defineEmits({
  'update:msg': val => val === 'foo'
});
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