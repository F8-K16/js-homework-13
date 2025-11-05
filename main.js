const dummyURL = "https://dummyjson.com/posts";

const root = document.querySelector("#root");
const modalEl = document.querySelector("#modal");
const inputSearchEl = document.querySelector("#search-form");
const newPostBtn = document.querySelector("#new-btn");
const oldPostBtn = document.querySelector("#old-btn");
const tabButtons = document.querySelectorAll(".tab-btn");
const loadingEl = document.querySelector("#loading");

oldPostBtn.classList.add("active");

const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch data!");
  return res.json();
};

const renderPosts = (posts) => {
  if (!posts || posts.length === 0) {
    root.innerHTML = `<p class="text-center text-gray-500 mt-10">Không có bài viết nào</p>`;
    return;
  }

  root.innerHTML = `
    <div class="posts">
      ${posts
        .map(
          (post) => `
          <div class="post bg-gray-50 p-4 mb-8 rounded-xl shadow hover:shadow-lg transition">
            <h2 class="text-xl font-semibold mb-2">${post.title}</h2>
            <p class="text-gray-600 mb-4">${post.body}</p>
            <div class="flex justify-between items-center">
              <button data-id="${post.id}" class="details-btn text-blue-500 hover:underline">
                Xem chi tiết
              </button>
              <div class="flex gap-2">
                <button class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Sửa</button>
                <button class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Xóa</button>
              </div>
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;
};

const renderModal = (post) => {
  modalEl.innerHTML = `
    <div class="modal-box relative bg-white p-8 pt-12 rounded-2xl max-w-2xl mx-auto animate-fadeIn">
      <button
        class="modal-close absolute top-3 right-4 text-3xl font-bold text-gray-400 hover:text-gray-700 transition"
      >
        &times;
      </button>

      <h2 class="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">${
        post.title
      }</h2>

      <p class="text-gray-700 leading-relaxed mb-10">${post.body}</p>

      <div class="grid grid-cols-4 gap-4 border-b pb-4 text-sm text-gray-600">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700"><i class="fa-solid fa-user" style="color: #000000;"></i> User ID:</span> ${
            post.userId
          }
        </div>
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700"><i class="fa-regular fa-eye" style="color: #B197FC;"></i> Views:</span> ${
            post.views
          }
        </div>
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700"><i class="fa-regular fa-thumbs-up" style="color: #20d9cd;"></i> Likes:</span> ${
            post.reactions?.likes ?? 0
          }
        </div>
        <div class="flex items-center gap-2">
          <span class="font-semibold text-gray-700"><i class="fa-regular fa-thumbs-down" style="color: #f01919;"></i> Dislikes:</span> ${
            post.reactions?.dislikes ?? 0
          }
        </div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Tags</h3>
        <div class="flex flex-wrap gap-2">
          ${post.tags
            .map(
              (tag) => `
            <span class="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
              #${tag}
            </span>`
            )
            .join("")}
        </div>
      </div>

      
    </div>
  `;
  modalEl.style.display = "flex";
};

const getAllPosts = async () => {
  try {
    showLoading();
    const data = await fetchJSON(dummyURL);
    renderPosts(data.posts);
  } catch (err) {
    console.error(err);
  } finally {
    hideLoading();
  }
};

const getSinglePost = async (postId) => {
  try {
    showLoading();
    const data = await fetchJSON(`${dummyURL}/${postId}`);
    renderModal(data);
  } catch (err) {
    console.error(err);
  } finally {
    hideLoading();
  }
};

const getSearchPost = async (keyword) => {
  try {
    if (!keyword) return getAllPosts();
    const data = await fetchJSON(`${dummyURL}/search?q=${keyword}`);
    renderPosts(data.posts);
  } catch (err) {
    console.error(err);
  }
};

const sortPostsById = async (orderType) => {
  try {
    showLoading();
    const data = await fetchJSON(`${dummyURL}?sortBy=id&order=${orderType}`);
    renderPosts(data.posts);
  } catch (error) {
    console.error(error);
  } finally {
    hideLoading();
  }
};

const showLoading = () => {
  loadingEl.classList.remove("hidden");
};

const hideLoading = () => {
  loadingEl.classList.add("hidden");
};

inputSearchEl.addEventListener("input", (e) => {
  const value = e.target.value.trim();
  getSearchPost(value);
});

newPostBtn.addEventListener("click", () => sortPostsById("desc"));
oldPostBtn.addEventListener("click", () => sortPostsById("asc"));
modalEl.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("modal-close") ||
    !e.target.closest(".modal-box")
  ) {
    modalEl.style.display = "none";
  }
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");
  });
});

root.addEventListener("click", (e) => {
  const detailBtn = e.target.closest(".details-btn");
  if (detailBtn) {
    getSinglePost(detailBtn.dataset.id);
  }
});

getAllPosts();
