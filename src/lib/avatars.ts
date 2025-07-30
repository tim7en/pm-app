export const DEFAULT_AVATARS = [
  {
    id: 'neutral-1',
    name: 'Professional Blue',
    url: '/avatars/01.png',
    style: 'neutral'
  },
  {
    id: 'neutral-2', 
    name: 'Clean Gray',
    url: '/avatars/02.png',
    style: 'neutral'
  },
  {
    id: 'funny-1',
    name: 'Friendly Green',
    url: '/avatars/03.png',
    style: 'funny'
  },
  {
    id: 'funny-2',
    name: 'Cheerful Orange',
    url: '/avatars/04.png',
    style: 'funny'
  }
]

export const getRandomDefaultAvatar = (style?: 'neutral' | 'funny') => {
  const filtered = style 
    ? DEFAULT_AVATARS.filter(avatar => avatar.style === style)
    : DEFAULT_AVATARS
  
  return filtered[Math.floor(Math.random() * filtered.length)]
}

export const getDefaultAvatarByIndex = (index: number) => {
  return DEFAULT_AVATARS[index % DEFAULT_AVATARS.length]
}

export const generateInitialsAvatar = (name: string) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-cyan-500'
  ]

  const colorIndex = name.length % colors.length
  const backgroundColor = colors[colorIndex]

  return {
    initials,
    backgroundColor,
    textColor: 'text-white'
  }
}
