/**
 * 文件上传 API
 *
 * 使用 uni.uploadFile 而非 uni.request，因为需要上传二进制文件
 * uni.uploadFile 专门用于 multipart/form-data 格式的文件上传
 *
 * 注意：uni.uploadFile 的返回值是字符串（不是对象），需要手动 JSON.parse
 */
const UPLOAD_URL = "http://localhost:3001/api/v1/files/upload";

/**
 * 上传文件到服务器
 * @param {string} filePath - 本地临时文件路径（由 uni.chooseImage 返回）
 * @returns {Promise<Object>} 返回 { url, thumbnailUrl, ... } 等文件信息
 */
export function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync("token") ?? "";
    uni.uploadFile({
      url: UPLOAD_URL,
      filePath,
      name: "file", // 后端 multer 接收的字段名
      header: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      success(res) {
        if (res.statusCode === 200) {
          // uni.uploadFile 返回的 res.data 是字符串，需要手动解析 JSON
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data.data);
          } else {
            uni.showToast({ title: data.message, icon: "none" });
            reject(new Error(data.message));
          }
        } else {
          reject(new Error("上传失败"));
        }
      },
      fail(err) {
        reject(err);
      },
    });
  });
}
