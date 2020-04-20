<template>
  <Layout>
    <h1>About us</h1>
    <section class="posts">
      <PostItem v-for="edge in $page.allPost.edges" :key="edge.node.id" :post="edge.node"></PostItem>
    </section>
  </Layout>
</template>

<script>
import PostItem from "~/components/PostItem.vue";

export default {
  components: {
    PostItem
  },
  metaInfo: {
    title: "About us"
  }
};
</script>

<page-query>
query {
  allPost {
    totalCount
    edges {
      node {
        id
        title
        description
        date (format: "D MMMM YYYY")
        path
        tags
      }
    }
  }
}
</page-query>
