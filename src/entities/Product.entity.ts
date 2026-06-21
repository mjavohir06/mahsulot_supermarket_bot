import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "./Category.entity.js";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  price!: string;

  // Chegirma narxi — mavjud bo'lsa va price'dan kichik bo'lsa, mahsulot
  // chegirmada hisoblanadi (formatPriceBlock shu mantiqni boshqaradi).
  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  discountPrice!: string | null;

  // Telegram file_id sifatida saqlanadi (URL emas!) — rasm bir marta
  // yuklangach Telegram serverlarida keshlanadi, qayta yuklash shart emas.
  // MAJBURIY: har bir mahsulotda rasm bo'lishi shart.
  @Column({ type: "varchar" })
  imageFileId!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: "SET NULL",
    nullable: true,
  })
  category!: Category | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
