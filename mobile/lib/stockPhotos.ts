export type StockPhotoCategory = 'selfie' | 'yemek' | 'seyahat' | 'spor' | 'doga';

export type StockPhotoCategoryInfo = {
  id: StockPhotoCategory;
  label: string;
  emoji: string;
};

export const STOCK_PHOTO_CATEGORIES: StockPhotoCategoryInfo[] = [
  { id: 'selfie', label: 'Selfie', emoji: '🤳' },
  { id: 'yemek', label: 'Yemek', emoji: '🍽️' },
  { id: 'seyahat', label: 'Seyahat', emoji: '✈️' },
  { id: 'spor', label: 'Spor', emoji: '⚽' },
  { id: 'doga', label: 'Doğa', emoji: '🌿' },
];

function photo(id: string): string {
  return `https://images.unsplash.com/${id}?w=800&h=800&fit=crop&q=80`;
}

export const STOCK_PHOTOS: Record<StockPhotoCategory, string[]> = {
  selfie: [
    photo('photo-1534528741775-53994a69daeb'),
    photo('photo-1529626455594-4ff0802cfb7e'),
    photo('photo-1494790108377-be9c29b29330'),
    photo('photo-1438761681033-6461ffad8d80'),
    photo('photo-1507003211169-0a1dd7228f2d'),
    photo('photo-1500648767791-00dcc994a43e'),
    photo('photo-1472099645785-5658abf4ff4e'),
    photo('photo-1544005313-94ddf0286df2'),
    photo('photo-1517841905240-472988babdf9'),
    photo('photo-1539575252587-b9712720f4ad'),
    photo('photo-1560250097-0b93528c311a'),
    photo('photo-1583867742474-8fba16413767'),
  ],
  yemek: [
    photo('photo-1567620905732-2d1ec7ab7445'),
    photo('photo-1546069901-ba9599a209e8'),
    photo('photo-1504674900247-0877df9cc836'),
    photo('photo-1565299624946-b28f40a0ae38'),
    photo('photo-1512621776951-a57141f2eefd'),
    photo('photo-1482045560487-93c45f2a9812'),
    photo('photo-1540189549336-e6e99c3679fe'),
    photo('photo-1565958011702-44f0027a9be1'),
    photo('photo-1498837167922-ddd275344240'),
    photo('photo-1563379926898-05f457165a38'),
    photo('photo-1529042410690-ce386490e263'),
    photo('photo-1555939594-58d7cb561ad1'),
  ],
  seyahat: [
    photo('photo-1488646953014-85cb44e25828'),
    photo('photo-1469854523086-cc02fe5d8800'),
    photo('photo-1476514525535-07fb3d4fd447'),
    photo('photo-1506929562872-bb421724f2b7'),
    photo('photo-1501785888041-ca93b2a7aea2'),
    photo('photo-1473625240860-3daa1695e780'),
    photo('photo-1499793983690-e29da5ef1d21'),
    photo('photo-1502602898657-3e91760cbb34'),
    photo('photo-1527631149223-ffe3d3b54403d'),
    photo('photo-1464818439490-d14892f5f315'),
    photo('photo-1512453979798-5ea266f8880c'),
    photo('photo-1533104867514-7deddf0d5e42'),
  ],
  spor: [
    photo('photo-1571019614242-c5c5dee9f50e'),
    photo('photo-1517649763962-0c623066007e'),
    photo('photo-1574680096145-d05b468e9986'),
    photo('photo-1517838277533-f67f70168254'),
    photo('photo-1576678927484-cc907957088c'),
    photo('photo-1518611012118-696072aa579a'),
    photo('photo-1517649832313-f163966224af'),
    photo('photo-1534438327276-14e5300c3a48'),
    photo('photo-1552674605-db6ffd4facb5'),
    photo('photo-1461896836934-ffe607ba7951'),
    photo('photo-1541534741688-607788c4682e'),
    photo('photo-1571902943202-507ec2618ac8'),
  ],
  doga: [
    photo('photo-1506905925346-21bda4d32df4'),
    photo('photo-1441974231531-c6227db76b6e'),
    photo('photo-1470071459604-3b5ec3a7fe05'),
    photo('photo-1426606686844-b5210621793b'),
    photo('photo-1472214103451-9374bd1c798e'),
    photo('photo-1518496785280-c852bad8134f'),
    photo('photo-1501854140801-50d01698950b'),
    photo('photo-1469474968028-56623f02e42e'),
    photo('photo-1518837695005-208309293b7f'),
    photo('photo-1447752875215-276762e9713b'),
    photo('photo-1439066615861-d1af74d74000'),
    photo('photo-1501594907352-04cda38ebc29'),
  ],
};
