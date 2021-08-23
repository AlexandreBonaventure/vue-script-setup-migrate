<script lang="ts">
export default {
  props: {
    msg: {
      type: String,
      required: true,
    }
  }
}
</script>
<template>
  <div>
    {{ msg }}
  </div>
</template>