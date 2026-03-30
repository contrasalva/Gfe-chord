import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  const passwordHash = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gfechurch.com' },
    update: {},
    create: {
      email: 'admin@gfechurch.com',
      name: 'Administrador GFE',
      passwordHash,
      role: 'ADMIN',
    },
  })

  console.log(`✅ Admin creado: ${admin.email}`)

  // Canción de ejemplo
  await prisma.song.upsert({
    where: { id: 'seed-song-1' },
    update: {},
    create: {
      id: 'seed-song-1',
      title: 'Santo',
      artist: 'Coalo Zamorano',
      key: 'G',
      capo: 0,
      bpm: 72,
      timeSignature: '4/4',
      content: `[Verso 1]
[G]Santo, [D]Santo, [Em]Santo
[C]Es el Señor [G]Dios [D]Todopoderoso
[G]Santo, [D]Santo, [Em]Santo
[C]Es el Señor [G]Dios [D]Todopoderoso

[Coro]
[G]El que [D]era, [Em]el que [C]es
[G]El que [D]ha de [C]venir [D]
[G]Santo es [D]el Se[Em]ñor [C]Dios
[G]Todopo[D]deroso [G]`,
      tags: JSON.stringify(['Adoración', 'Alabanza']),
      createdById: admin.id,
    },
  })

  console.log('✅ Canción de ejemplo creada')
  console.log('\n🎸 Seed completado')
  console.log('📧 Email: admin@gfechurch.com')
  console.log('🔑 Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
