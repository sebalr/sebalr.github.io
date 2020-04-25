<!-- Page -->
<template>
  <Layout>
    <section class="container">
      <h2 class="hi-title">Hello!</h2>
      <h3 class="im-title">I'm</h3>
      <label>{{nameLabel}}</label>
      <span class="cursor">&nbsp;</span>
    </section>
  </Layout>
</template>

<script>
const textArray = ["Sebastian", "a Software Engineer", "a developer"];
const typingDelay = 150;
const erasingDelay = 100;
const newTextDelay = 1500;

let textArrayIndex = 0;
let charIndex = 0;
export default {
  data() {
    return {
      nameLabel: ""
    };
  },
  methods: {
    type() {
      if (charIndex < textArray[textArrayIndex].length) {
        this.nameLabel += textArray[textArrayIndex].charAt(charIndex);
        charIndex++;
        setTimeout(() => this.type(), typingDelay);
      } else {
        setTimeout(() => this.erase(), newTextDelay);
      }
    },
    erase() {
      if (charIndex > 0) {
        this.nameLabel = textArray[textArrayIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(() => this.erase(), erasingDelay);
      } else {
        textArrayIndex++;
        if (textArrayIndex >= textArray.length) textArrayIndex = 0;
        setTimeout(() => this.type(), typingDelay + 1100);
      }
    }
  },
  mounted: function() {
    setTimeout(() => this.type(), 200);
  }
};
</script>

<style scoped>
.hi-title {
  font-size: 6rem;
}

.im-title {
  font-size: 4rem;
  display: inline-block;
  margin-right: 4rem;
}

span.cursor {
  display: inline-block;
  background-color: #ccc;
  margin-left: 0.1rem;
  width: 3px;
  animation: blink 1s infinite;
}
/* cursor animations */
@keyframes blink {
  0% {
    background-color: #ccc;
  }
  49% {
    background-color: #ccc;
  }
  50% {
    background-color: transparent;
  }
  99% {
    background-color: transparent;
  }
  100% {
    background-color: #ccc;
  }
}
</style>
