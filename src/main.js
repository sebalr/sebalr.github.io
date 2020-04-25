import '~/assets/styles.scss'
import DefaultLayout from '~/layouts/Default.vue'
import Buefy from 'buefy'



export default function (Vue, { router, head, isClient }) {
  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout)
  Vue.use(Buefy)
}
