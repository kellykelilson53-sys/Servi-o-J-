// Angola Provinces and Municipalities data

export interface Municipality {
  name: string;
  province: string;
}

export interface Province {
  name: string;
  municipalities: string[];
}

export const PROVINCES: Province[] = [
  {
    name: 'Bengo',
    municipalities: ['Ambriz', 'Bula Atumba', 'Dande', 'Dembos', 'Nambuangongo', 'Pango Aluquém']
  },
  {
    name: 'Benguela',
    municipalities: ['Baía Farta', 'Balombo', 'Benguela', 'Bocoio', 'Caimbambo', 'Catumbela', 'Chongorói', 'Cubal', 'Ganda', 'Lobito']
  },
  {
    name: 'Bié',
    municipalities: ['Andulo', 'Camacupa', 'Catabola', 'Chinguar', 'Chitembo', 'Cuemba', 'Cunhinga', 'Cuíto', 'Nharea']
  },
  {
    name: 'Cabinda',
    municipalities: ['Belize', 'Buco-Zau', 'Cabinda', 'Cacongo']
  },
  {
    name: 'Cuando Cubango',
    municipalities: ['Calai', 'Cuangar', 'Cuchi', 'Cuito Cuanavale', 'Dirico', 'Mavinga', 'Menongue', 'Nancova', 'Rivungo']
  },
  {
    name: 'Cuanza Norte',
    municipalities: ['Ambaca', 'Banga', 'Bolongongo', 'Cambambe', 'Cazengo', 'Golungo Alto', 'Gonguembo', 'Lucala', 'Quiculungo', 'Samba Cajú']
  },
  {
    name: 'Cuanza Sul',
    municipalities: ['Amboim', 'Cassongue', 'Cela', 'Conda', 'Ebo', 'Libolo', 'Mussende', 'Porto Amboim', 'Quibala', 'Quilenda', 'Seles', 'Sumbe']
  },
  {
    name: 'Cunene',
    municipalities: ['Cahama', 'Cuanhama', 'Curoca', 'Cuvelai', 'Namacunde', 'Ombadja']
  },
  {
    name: 'Huambo',
    municipalities: ['Bailundo', 'Cachiungo', 'Caála', 'Ecunha', 'Huambo', 'Londuimbali', 'Longonjo', 'Mungo', 'Chicala-Cholohanga', 'Chinjenje', 'Ucuma']
  },
  {
    name: 'Huíla',
    municipalities: ['Caconda', 'Cacula', 'Caluquembe', 'Chiange', 'Chibia', 'Chicomba', 'Chipindo', 'Cuvango', 'Gambos', 'Humpata', 'Jamba', 'Lubango', 'Matala', 'Quilengues', 'Quipungo']
  },
  {
    name: 'Luanda',
    municipalities: ['Belas', 'Cacuaco', 'Cazenga', 'Ícolo e Bengo', 'Kilamba Kiaxi', 'Luanda', 'Quiçama', 'Talatona', 'Viana']
  },
  {
    name: 'Lunda Norte',
    municipalities: ['Cambulo', 'Capenda-Camulemba', 'Caungula', 'Chitato', 'Cuango', 'Cuílo', 'Lubalo', 'Lucapa', 'Xá-Muteba']
  },
  {
    name: 'Lunda Sul',
    municipalities: ['Cacolo', 'Dala', 'Muconda', 'Saurimo']
  },
  {
    name: 'Malanje',
    municipalities: ['Cacuso', 'Calandula', 'Cambundi-Catembo', 'Cangandala', 'Caombo', 'Cuaba Nzoji', 'Cunda-Dia-Baze', 'Luquembo', 'Malanje', 'Marimba', 'Massango', 'Mucari', 'Quela', 'Quirima']
  },
  {
    name: 'Moxico',
    municipalities: ['Alto Zambeze', 'Bundas', 'Camanongue', 'Léua', 'Luacano', 'Luau', 'Luchazes', 'Lumeje', 'Moxico']
  },
  {
    name: 'Namibe',
    municipalities: ['Bibala', 'Camucuio', 'Moçâmedes', 'Tômbua', 'Virei']
  },
  {
    name: 'Uíge',
    municipalities: ['Alto Cauale', 'Ambuíla', 'Bembe', 'Buengas', 'Bungo', 'Damba', 'Macocola', 'Milunga', 'Mucaba', 'Negage', 'Puri', 'Quimbele', 'Quitexe', 'Sanza Pombo', 'Songo', 'Uíge']
  },
  {
    name: 'Zaire',
    municipalities: ['Cuimba', 'Mbanza Congo', 'Nóqui', 'Nzeto', 'Soyo', 'Tomboco']
  }
];

export const getProvinceNames = (): string[] => {
  return PROVINCES.map(p => p.name);
};

export const getMunicipalitiesByProvince = (provinceName: string): string[] => {
  const province = PROVINCES.find(p => p.name === provinceName);
  return province ? province.municipalities : [];
};
