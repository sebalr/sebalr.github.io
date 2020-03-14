<template>
  <div class="main-layout">
    <div class="sidebar">
      <Sidebar></Sidebar>
    </div>
    <div class="main-content">
      <slot />
    </div>
  </div>
</template>

<static-query>
query {
  metadata {
    siteName
  }
}
</static-query>

<script>
import Sidebar from "~/components/Sidebar.vue";

export default {
  components: {
    Sidebar
  }
};
</script>


<style>
.main-layout {
  display: flex;
  flex-direction: row;
  flex: 1;
}

.sidebar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.main-content {
  display: flex;
  flex: 1;
}
</style>
