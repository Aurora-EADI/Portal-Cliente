import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.userMobile.findUnique({
    where: { email: "jonathan@portalmobile.com" },
  });

  if (existing) {
    console.log("Usuário mobile já existe, pulando seed.");
    return;
  }

  const user = await prisma.userMobile.create({
    data: {
      name: "Jonathan Ferreira",
      email: "jonathan@portalmobile.com",
      password: await bcrypt.hash("admin123", 10),
      role: "INSPECTOR",
      avatarInitials: "JF",
    },
  });

  console.log(`✅ Usuário mobile criado: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
