const dummyURL = "https://dummyjson.com/posts";

const root = document.querySelector("#root");
const modalEl = document.querySelector("#modal");
const modalContent = document.querySelector("#modal-content");
const inputSearchEl = document.querySelector("#search-form");
const newPostBtn = document.querySelector("#new-btn");
const oldPostBtn = document.querySelector("#old-btn");
const tabButtons = document.querySelectorAll(".tab-btn");
const loadingEl = document.querySelector("#loading");
const openCreateModal = document.querySelector("#open-create-modal");

let currentModalType = null;
const LIMIT_POSTS_SIZE = 10;
const PAGINATION_GROUP = 10;
// Fake action CUD by new Array
let localPosts = [];

// Fetch API
const fetchJSON = async (url) => {
  try {
    showLoading();
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch data!");
    return res.json();
  } catch (err) {
    console.error("Fetch Error:", err);
  } finally {
    hideLoading();
  }
};

const renderPosts = (posts) => {
  if (!posts.length) {
    root.innerHTML = `<p class="text-center text-gray-500 mt-10">Không có bài viết nào</p>`;
    return;
  }

  root.innerHTML = `
    <div class="posts">
      ${posts
        .map(
          (post) => `
          <div class="post bg-gray-50 p-4 mb-8 rounded-xl shadow hover:shadow-lg transition" data-id="${post.id}">
            <h2 class="text-xl font-semibold mb-2">${post.title}</h2>
            <p class="text-gray-600 mb-4">${post.body}</p>
            <div class="flex justify-between items-center">
              <button class="details-btn text-blue-500 hover:underline">
                Xem chi tiết
              </button>
              <div class="flex gap-2">
                <button class="edit-btn bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Sửa</button>
                <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Xóa</button>
              </div>
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;
};

const getPaginatedPosts = async (page = 1, order = "desc") => {
  const skip = (page - 1) * LIMIT_POSTS_SIZE;
  const data = await fetchJSON(
    `${dummyURL}?limit=${LIMIT_POSTS_SIZE}&skip=${skip}&sortBy=id&order=${order}`
  );
  localPosts = data.posts;
  renderPosts(localPosts);
  renderPagination(order, data.total, page);
};

const renderPagination = (order, totalPosts, currentPage) => {
  const totalPages = Math.ceil(totalPosts / LIMIT_POSTS_SIZE);
  const pageGroup = Math.ceil(currentPage / PAGINATION_GROUP);
  const startPage = (pageGroup - 1) * PAGINATION_GROUP + 1;
  const endPage = Math.min(pageGroup * PAGINATION_GROUP, totalPages);

  let paginationEl = document.querySelector("#pagination");
  if (!paginationEl) {
    paginationEl = document.createElement("div");
    paginationEl.id = "pagination";
    paginationEl.className =
      "flex justify-center items-center gap-4 mt-6 flex-wrap";
    root.insertAdjacentElement("afterend", paginationEl);
  }

  paginationEl.innerHTML = `
    <button id="prev-group" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" ${
      startPage === 1 ? "disabled" : ""
    }>Trước</button>
    ${Array.from({ length: endPage - startPage + 1 }, (_, i) => {
      const page = startPage + i;
      const activeClass =
        page === currentPage
          ? "bg-blue-500 text-white"
          : "bg-gray-200 hover:bg-gray-300";
      return `<button class="page-btn px-3 py-1 rounded ${activeClass}" data-page="${page}">${page}</button>`;
    }).join("")}
    <button id="next-group" class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300" ${
      endPage === totalPages ? "disabled" : ""
    }>Sau</button>
  `;

  paginationEl.onclick = (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.id === "prev-group")
      return getPaginatedPosts(startPage - PAGINATION_GROUP, order);
    if (btn.id === "next-group") return getPaginatedPosts(endPage + 1, order);
    if (btn.classList.contains("page-btn"))
      return getPaginatedPosts(+btn.dataset.page, order);
  };
};

const renderDetailsModal = (post) => {
  currentModalType = "details";
  modalContent.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 mt-5 text-gray-800 border-b pb-2">${
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

        <div class="mt-4">
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
     
  `;
  openModal();
};

const renderActionModal = (type, post = {}) => {
  currentModalType = type;

  const isEdit = type === "edit";
  const title = isEdit ? "Chỉnh sửa bải viết" : "Thêm mới bài viết";
  const formId = isEdit ? "edit-post-form" : "create-post-form";

  modalContent.innerHTML = `
      <h2 class="text-2xl font-bold mb-6 mt-2 text-gray-800 border-b pb-2">${title}</h2>
      <form id=${formId} class="flex flex-col gap-4">
        <div>
          <label class="block mb-1 font-medium text-gray-700">Tiêu đề</label>
          <input 
            type="text" 
            id="${isEdit ? "edit-title" : "new-title"}" 
            value="${post.title || ""}" 
            class="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400" 
          /> 
        </div>
        <div>
          <label class="block mb-1 font-medium text-gray-700">Nội dung</label>
          <textarea id=${isEdit ? "edit-body" : "new-body"} rows="10" required
                    class="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400">${
                      post.body || ""
                    }</textarea>
        </div>
        
        <button type="submit"
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-[30%] mx-auto">
          Lưu bài viết
        </button>
      </form>
  `;
  openModal();

  const form = document.querySelector(`#${formId}`);
  form.addEventListener("submit", async (e) => {
    isEdit ? await handleEdit(e, post.id) : await handleCreate(e);
  });
};

const getDetailsPost = async (id) => {
  const data = await fetchJSON(`${dummyURL}/${id}`);
  renderDetailsModal(data);
};

const getSearchPost = async (keyword) => {
  if (!keyword) return getPaginatedPosts(1, "desc");
  const data = await fetchJSON(`${dummyURL}/search?q=${keyword}`);
  renderPosts(data.posts);
};

const handleSearch = debounce((e) => {
  getSearchPost(e.target.value.trim());
}, 500);

const handleCreate = async (e) => {
  e.preventDefault();
  const title = document.querySelector("#new-title").value.trim();
  const body = document.querySelector("#new-body").value.trim();

  if (!title || !body) return alert("Vui lòng nhập đầy đủ thông tin bài viết!");
  try {
    showLoading();
    const res = await fetch(`${dummyURL}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        userId: 5,
      }),
    });

    const newPost = await res.json();
    localPosts.unshift(newPost);
    renderPosts(localPosts);
    if (oldPostBtn.classList.contains("active")) {
      oldPostBtn.classList.remove("active");
      newPostBtn.classList.add("active");
    }
  } catch (err) {
    console.error(err);
  } finally {
    hideLoading();
    closeModal();
  }
};

const handleEdit = async (e, postId) => {
  e.preventDefault();
  const title = document.querySelector("#edit-title").value.trim();
  const body = document.querySelector("#edit-body").value.trim();

  if (!title || !body) return alert("Vui lòng nhập đầy đủ thông tin!");

  try {
    showLoading();
    const res = await fetch(`${dummyURL}/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });

    const updatedPost = await res.json();
    localPosts = localPosts.map((post) =>
      post.id === Number(postId) ? updatedPost : post
    );
    renderPosts(localPosts);
  } catch (error) {
    console.error("Cập nhật thất bại:", error);
  } finally {
    hideLoading();
    closeModal();
  }
};

const handleDelete = async (postId) => {
  if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;

  try {
    showLoading();
    await fetch(`${dummyURL}/${postId}`, { method: "DELETE" });

    localPosts = localPosts.filter((post) => post.id !== Number(postId));
    console.log(localPosts);

    renderPosts(localPosts);
  } catch (error) {
    console.error("Xóa thất bại:", error);
  } finally {
    hideLoading();
  }
};

const sortPostsById = async (orderType) => {
  getPaginatedPosts(1, orderType);
};

const showLoading = () => loadingEl.classList.remove("hidden");
const hideLoading = () => loadingEl.classList.add("hidden");
const openModal = () => modalEl.classList.replace("hidden", "flex");
const closeModal = () => {
  modalEl.classList.add("hidden");
  currentModalType = null;
};

function debounce(callback, timeout = 500) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, timeout);
  };
}

function init() {
  newPostBtn.classList.add("active");
  getPaginatedPosts(1, "desc");
  inputSearchEl.addEventListener("input", handleSearch);
  openCreateModal.addEventListener("click", () => renderActionModal("create"));

  root.addEventListener("click", async (e) => {
    const post = e.target.closest(".post");
    if (!post) return;
    const postId = post.dataset.id;

    if (e.target.closest(".details-btn")) {
      getDetailsPost(postId);
    }
    if (e.target.closest(".edit-btn")) {
      const postData = await fetchJSON(`${dummyURL}/${postId}`);
      renderActionModal("edit", postData);
    }

    if (e.target.closest(".delete-btn")) {
      handleDelete(postId);
    }
  });

  tabButtons.forEach((btn) =>
    btn.addEventListener("click", (e) => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      const target = e.currentTarget;
      target.classList.add("active");
      const order = target.id === "old-btn" ? "asc" : "desc";
      getPaginatedPosts(1, order);
    })
  );

  modalEl.addEventListener("click", (e) => {
    const isCloseBtn = e.target.classList.contains("modal-close");
    const outside = !e.target.closest(".modal-box");
    if (currentModalType === "create" && isCloseBtn) {
      if (confirm("Bạn có chắc muốn hủy tạo bài viết?")) closeModal();
    }
    if (currentModalType === "edit" && isCloseBtn) {
      if (confirm("Bạn có chắc muốn hủy chỉnh sửa bài viết?")) closeModal();
    }
    if (currentModalType === "details" && (isCloseBtn || outside)) {
      closeModal();
    }
  });
}

init();
