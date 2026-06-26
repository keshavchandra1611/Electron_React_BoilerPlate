// MyNote: Boys Images
import boy01 from './boy/boySvg01.svg';
import boy02 from './boy/boySvg02.svg';
import boy03 from './boy/boySvg03.svg';
import boy04 from './boy/boySvg04.svg';
import boy05 from './boy/boySvg05.svg';
import boy06 from './boy/boySvg06.svg';
import boy07 from './boy/boySvg07.svg';
import boy08 from './boy/boySvg08.svg';
import boy09 from './boy/boySvg09.svg';
import boy10 from './boy/boySvg10.svg';
import boy11 from './boy/boySvg11.svg';
import boy12 from './boy/boySvg12.svg';
import boy13 from './boy/boySvg13.svg';
import boy14 from './boy/boySvg14.svg';
import boy15 from './boy/boySvg15.svg';
import boy16 from './boy/boySvg16.svg';
import boy17 from './boy/boySvg17.svg';
import boy18 from './boy/boySvg18.svg';
import boy19 from './boy/boySvg19.svg';
import boy20 from './boy/boySvg20.svg';

// MyNote: Girls Images
import girl01 from './girl/girlSvg01.svg';
import girl02 from './girl/girlSvg02.svg';
import girl03 from './girl/girlSvg03.svg';
import girl04 from './girl/girlSvg04.svg';
import girl05 from './girl/girlSvg05.svg';
import girl06 from './girl/girlSvg06.svg';
import girl07 from './girl/girlSvg07.svg';
import girl08 from './girl/girlSvg08.svg';
import girl09 from './girl/girlSvg09.svg';
import girl10 from './girl/girlSvg10.svg';
import girl11 from './girl/girlSvg11.svg';
import girl12 from './girl/girlSvg12.svg';
import girl13 from './girl/girlSvg13.svg';
import girl14 from './girl/girlSvg14.svg';
import girl15 from './girl/girlSvg15.svg';
import girl16 from './girl/girlSvg16.svg';
import girl17 from './girl/girlSvg17.svg';
import girl18 from './girl/girlSvg18.svg';
import girl19 from './girl/girlSvg19.svg';
import girl20 from './girl/girlSvg20.svg';
import girl21 from './girl/girlSvg21.svg';
import girl22 from './girl/girlSvg22.svg';
import girl23 from './girl/girlSvg23.svg';
import girl24 from './girl/girlSvg24.svg';
import girl25 from './girl/girlSvg25.svg';
import girl26 from './girl/girlSvg26.svg';
import girl27 from './girl/girlSvg27.svg';
import girl28 from './girl/girlSvg28.svg';
import girl29 from './girl/girlSvg29.svg';
import girl30 from './girl/girlSvg30.svg';
import girl31 from './girl/girlSvg31.svg';
import girl32 from './girl/girlSvg32.svg';
import girl33 from './girl/girlSvg33.svg';
import girl34 from './girl/girlSvg34.svg';
import girl35 from './girl/girlSvg35.svg';
import girl36 from './girl/girlSvg36.svg';
import girl37 from './girl/girlSvg37.svg';
import girl38 from './girl/girlSvg38.svg';
import girl39 from './girl/girlSvg39.svg';
import girl40 from './girl/girlSvg40.svg';

export const BoysChildImages = {
  boy01,
  boy02,
  boy03,
  boy04,
  boy05,
  boy06,
  boy07,
  boy08,
  boy09,
  boy10,
  boy11,
  boy12,
  boy13,
  boy14,
  boy15,
  boy16,
  boy17,
  boy18,
  boy19,
  boy20,
};

export const GirlChildImages = {
  girl01,
  girl02,
  girl03,
  girl04,
  girl05,
  girl06,
  girl07,
  girl08,
  girl09,
  girl10,
  girl11,
  girl12,
  girl13,
  girl14,
  girl15,
  girl16,
  girl17,
  girl18,
  girl19,
  girl20,
  girl21,
  girl22,
  girl23,
  girl24,
  girl25,
  girl26,
  girl27,
  girl28,
  girl29,
  girl30,
  girl31,
  girl32,
  girl33,
  girl34,
  girl35,
  girl36,
  girl37,
  girl38,
  girl39,
  girl40,
};

export const ChildrenImages = {
  defaultChild:boy01,
  ...BoysChildImages,
  ...GirlChildImages,
};

// MyNote: Get By Gender
export const getRandomBoyAvatar = () => {
  const boysArray = Object.values(BoysChildImages);
  const randomIndex = Math.floor(Math.random() * boysArray.length);
  return boysArray[randomIndex];
};
export const getRandomGirlAvatar = () => {
  const girlsArray = Object.values(GirlChildImages);
  const randomIndex = Math.floor(Math.random() * girlsArray.length);
  return girlsArray[randomIndex];
};
export const getRandomAvatarByGender = (gender) => {
  gender = gender.toLowerCase();
  return gender === 'male' ? getRandomBoyAvatar() : getRandomGirlAvatar();
};

// MyNote: Get By RollNumber
// Deterministic Avatar Functions
export const getBoyAvatarByRollNumber = (rollNumber) => {
  const boysArray = Object.values(BoysChildImages);
  const index = (rollNumber - 1) % boysArray.length;
  return boysArray[index];
};

export const getGirlAvatarByRollNumber = (rollNumber) => {
  const girlsArray = Object.values(GirlChildImages);
  const index = (rollNumber - 1) % girlsArray.length;
  return girlsArray[index];
};

// MyNote: Get By Gender And RollNumber
export const getAvatarByGenderAndRoll = (gender, rollNumber) => {
  gender = gender.toLowerCase();
  return gender === 'male'
    ? getBoyAvatarByRollNumber(rollNumber)
    : getGirlAvatarByRollNumber(rollNumber);
};
