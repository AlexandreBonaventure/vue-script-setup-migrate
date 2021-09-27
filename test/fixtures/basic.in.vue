<script lang="ts">
import { computed } from 'vue';
import TestComponent from './TestComponent.vue';
export default {
  components: {
    TestComponent,
  },
  props: {
    msg: {
      type: String as () => 'literal',
      required: true
    }
  },
  emits: {
    'update:msg': val => val === 'foo'
  },
  inheritAttrs: false,
  setup (props) {
    const computedMsg = computed(() => props.msg + 'bar');
    return {
      computedMsg,
    }
  }
}
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