import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "mysql123456",
  database: "campus_forum",
  connectionLimit: 10,
  acquireTimeout: 30000,
  connectTimeout: 10000,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe_123456", 10);

  await prisma.user.upsert({
    where: { adminAccount: "admin" },
    update: {},
    create: {
      adminAccount: "admin",
      nickname: "系统管理员",
      role: 2,
      status: 0,
      passwordHash,
    },
  });

  await prisma.category.createMany({
    data: [
      { categoryName: "校园生活", categoryDesc: "日常交流与校园见闻", sortOrder: 10, allowUserPost: 1 },
      { categoryName: "学习互助", categoryDesc: "课程、考试与资料互助", sortOrder: 20, allowUserPost: 1 },
      { categoryName: "失物招领", categoryDesc: "失物与招领信息", sortOrder: 30, allowUserPost: 1 },
      { categoryName: "活动公告", categoryDesc: "社团、讲座与校园活动", sortOrder: 40, allowUserPost: 0 },
    ],
    skipDuplicates: true,
  });

  await prisma.appConfig.createMany({
    data: [
      {
        configKey: "review_mode",
        configValue: "pre",
        valueType: "string",
        description: "pre=先审后发，post=先发后审",
        isPublic: 0,
      },
      {
        configKey: "upload.max_image_size_mb",
        configValue: "5",
        valueType: "number",
        description: "单张图片最大 MB",
        isPublic: 1,
      },
      {
        configKey: "upload.max_images_per_post",
        configValue: "9",
        valueType: "number",
        description: "单帖最多图片数",
        isPublic: 1,
      },
      {
        configKey: "comment_filter_enabled",
        configValue: "true",
        valueType: "boolean",
        description: "是否启用评论敏感词过滤（true=启用，false=关闭）",
        isPublic: 0,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.sensitiveWord.createMany({
    data: [
      { word: "测试敏感词", level: 1, category: "test" },
      { word: "违规示例", level: 1, category: "test" },
    ],
    skipDuplicates: true,
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
