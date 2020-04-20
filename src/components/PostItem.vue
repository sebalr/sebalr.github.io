<template>
  <div class="post-item">
    <hr class="line" />
    <p class="date" v-html="post.date" />
    <h1 class="title" v-html="post.title" />
    <p class="description" v-html="post.description" />
    <g-link :to="post.path" class="read">Read More...</g-link>
  </div>
</template>

<script>
export default {
  props: ["post"]
};
</script>
