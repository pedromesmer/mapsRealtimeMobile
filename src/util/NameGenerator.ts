const NameGenerator = () => {
  const caracters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let genName = '';
  for (let i = 0; i < 5; i += 1) {
    genName += caracters[Math.floor(Math.random() * caracters.length)];
  }

  return genName;
};

export {NameGenerator};
