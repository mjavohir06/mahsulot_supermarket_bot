import "reflect-metadata";
import { DataSource } from "typeorm";
import { Category } from "./entities/Category.entity.js";
import { Product } from "./entities/Product.entity.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Faqat development uchun! Production'da migration ishlatiladi.
  synchronize: process.env.NODE_ENV !== "production",
  logging: false,
  entities: [Category, Product],
});
