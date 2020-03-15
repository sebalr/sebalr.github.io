<template>
  <aside class="menu">
    <ul class="menu-list">
      <li>
        <g-link to="/">Home</g-link>
      </li>
      <li>
        <g-link to="/blog">Posts</g-link>
      </li>
    </ul>
  </aside>
</template>

<script>
export default {
  name: "Sidebar",
  data() {
    return {
      isActive: true
    };
  }
};
</script>
