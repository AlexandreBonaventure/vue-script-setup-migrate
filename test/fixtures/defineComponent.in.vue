<script lang="ts">
export default defineComponent({
  setup () {
    const msg = ref('msg');
    return {
      msg
    }
  }
})
</script>
<template>
  <div>
    {{ msg }}
  </div>
</template>