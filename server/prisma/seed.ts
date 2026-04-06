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

  const extraSongs = [
    {
      id: 'seed-song-2',
      title: 'Agnus Dei',
      artist: 'Michael W. Smith',
      key: 'A',
      capo: 0,
      bpm: 68,
      timeSignature: '4/4',
      content: `[Verso]
[A]Aleluya, [E]aleluya
[F#m]Por siempre [D]santo eres Señor
[A]Aleluya, [E]aleluya
[F#m]Por siempre [D]digno eres Señor

[Coro]
[A]Cordero [E]de Dios
[F#m]Santo eres [D]tú
[A]Cordero [E]de Dios
[F#m]Santo eres [D]tú [E] [A]`,
      tags: JSON.stringify(['Adoración']),
    },
    {
      id: 'seed-song-3',
      title: 'Bendito el Nombre',
      artist: 'Matt Redman',
      key: 'E',
      capo: 2,
      bpm: 74,
      timeSignature: '4/4',
      content: `[Verso]
[E]Bendito el nombre [B]del Señor
[C#m]Bendito el nombre [A]del Señor
[E]Bendito el nombre [B]del Señor
[A]Bendito sea su [B]nombre

[Coro]
[E]Tú das y [B]tú quitas
[C#m]Tú das y [A]tú quitas
[E]Tú das y [B]tú quitas
[A]Bendito sea tu [B]nombre [E]`,
      tags: JSON.stringify(['Alabanza', 'Adoración']),
    },
    {
      id: 'seed-song-4',
      title: 'Como el Cielo',
      artist: 'Hillsong',
      key: 'C',
      capo: 0,
      bpm: 80,
      timeSignature: '4/4',
      content: `[Verso]
[C]Grande es el Señor
[G]Digno de alabar
[Am]Grande es el Señor
[F]Y muy digno de [G]honor

[Coro]
[C]Al que fue y [G]que es
[Am]Al que ha de [F]venir
[C]Al Rey de [G]reyes
[F]Adoramos [G]a ti [C]`,
      tags: JSON.stringify(['Alabanza']),
    },
    {
      id: 'seed-song-5',
      title: 'Fuego de Tu Presencia',
      artist: 'Marcos Witt',
      key: 'D',
      capo: 0,
      bpm: 76,
      timeSignature: '4/4',
      content: `[Verso]
[D]Enciende mi corazón
[A]Con tu fuego [G]Señor
[D]Que tu Espíritu [A]venga
[G]Y me transfor[A]me hoy

[Coro]
[D]Fuego de tu [A]presencia
[Bm]Llena este [G]lugar
[D]Fuego de tu [A]presencia
[G]Señor [A]desciende [D]ya`,
      tags: JSON.stringify(['Adoración', 'Espíritu Santo']),
    },
    {
      id: 'seed-song-6',
      title: 'Glorioso',
      artist: 'Jesus Culture',
      key: 'G',
      capo: 0,
      bpm: 72,
      timeSignature: '4/4',
      content: `[Verso]
[G]Aquí estoy, [D]Señor
[Em]Ante tu [C]presencia
[G]Aquí estoy, [D]rendido
[Em]A tus [C]pies

[Coro]
[G]Glorioso, [D]glorioso
[Em]Glorioso [C]eres tú
[G]Glorioso, [D]glorioso
[Em]Rey de [C]gloria [G]eres tú`,
      tags: JSON.stringify(['Adoración']),
    },
    {
      id: 'seed-song-7',
      title: 'Hosanna',
      artist: 'Hillsong United',
      key: 'B',
      capo: 0,
      bpm: 78,
      timeSignature: '4/4',
      content: `[Verso]
[B]Sana mi corazón [F#]Señor
[G#m]Y hazme nuevo [E]a mí
[B]Toma todo lo que [F#]soy
[E]Y hazme más como [F#]ti

[Coro]
[B]Hosanna, [F#]hosanna
[G#m]Hosanna en [E]las alturas
[B]Hosanna, [F#]hosanna
[E]Hosanna en las [F#]alturas [B]`,
      tags: JSON.stringify(['Alabanza', 'Adoración']),
    },
    {
      id: 'seed-song-8',
      title: 'Maravilloso',
      artist: 'Danilo Montero',
      key: 'F',
      capo: 0,
      bpm: 70,
      timeSignature: '4/4',
      content: `[Verso]
[F]Maravilloso eres [C]tú
[Dm]No hay nadie como [Bb]tú
[F]Maravilloso eres [C]tú
[Bb]Mi Dios y [C]Salvador

[Coro]
[F]Digno de [C]alabanza
[Dm]Digno de [Bb]honor
[F]Digno de [C]toda gloria
[Bb]Mi [C]Señor [F]`,
      tags: JSON.stringify(['Adoración']),
    },
    {
      id: 'seed-song-9',
      title: 'Oh Señor',
      artist: 'Redimi2',
      key: 'Am',
      capo: 0,
      bpm: 82,
      timeSignature: '4/4',
      content: `[Verso]
[Am]Oh Señor, [G]cuán bueno eres
[F]Cuán grande es [Em]tu amor
[Am]Oh Señor, [G]tu misericordia
[F]Es nueva cada [E]mañana

[Coro]
[Am]Para siempre [G]tu bondad
[F]Para siempre [Em]tu verdad
[Am]Para siempre [G]tu poder
[F]Para siempre [E]tu [Am]querer`,
      tags: JSON.stringify(['Alabanza']),
    },
    {
      id: 'seed-song-10',
      title: 'Tu Fidelidad',
      artist: 'Christine D\'Clario',
      key: 'D',
      capo: 2,
      bpm: 66,
      timeSignature: '4/4',
      content: `[Verso]
[D]Grande es tu [A]fidelidad
[Bm]Oh Dios, [G]Padre eterno
[D]No hay sombra de [A]variación
[G]En ti [A]siempre fiel

[Coro]
[D]Grande es [A]tu fidelidad
[Bm]Grande es [G]tu fidelidad
[D]Cada mañana [A]tus misericordias son
[G]Nuevas [A]cada [D]día`,
      tags: JSON.stringify(['Adoración', 'Fidelidad']),
    },
    {
      id: 'seed-song-11',
      title: 'Renuévame',
      artist: 'Marcos Witt',
      key: 'G',
      capo: 0,
      bpm: 68,
      timeSignature: '3/4',
      content: `[Verso]
[G]Renuévame, [D]renuévame
[Em]No quiero ser [C]igual
[G]Renuévame, [D]renuévame
[C]Transforma [D]mi vivir

[Coro]
[G]Espíritu [D]Santo
[Em]Llena este [C]lugar
[G]Tu presencia [D]es lo que
[C]Necesito [D]hoy [G]`,
      tags: JSON.stringify(['Espíritu Santo', 'Adoración']),
    },
  ]

  for (const song of extraSongs) {
    await prisma.song.upsert({
      where: { id: song.id },
      update: {},
      create: {
        ...song,
        tags: song.tags,
        createdById: admin.id,
      },
    })
  }

  console.log(`✅ ${extraSongs.length} canciones adicionales creadas`)
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
