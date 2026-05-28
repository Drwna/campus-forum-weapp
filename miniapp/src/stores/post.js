import { defineStore } from "pinia";
import { ref } from "vue";
import { getPostList } from "../api/post.js";

export const usePostStore = defineStore("post", () => {
  const posts = ref([]);
  const page = ref(1);
  const hasMore = ref(true);
  const loading = ref(false);
  const categoryId = ref("");

  async function loadPosts(isRefresh = false) {
    if (loading.value) return;
    if (isRefresh) {
      page.value = 1;
      hasMore.value = true;
    }
    if (!hasMore.value) return;

    loading.value = true;
    try {
      const params = { page: page.value, size: 20, sort: "latest" };
      if (categoryId.value) params.categoryId = categoryId.value;

      const res = await getPostList(params);
      const result = res.data;

      if (isRefresh) {
        posts.value = result.list;
      } else {
        posts.value = [...posts.value, ...result.list];
      }

      hasMore.value = result.hasMore;
      page.value++;
    } finally {
      loading.value = false;
    }
  }

  function setCategory(id) {
    categoryId.value = id;
  }

  return { posts, page, hasMore, loading, categoryId, loadPosts, setCategory };
});
