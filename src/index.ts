const main = async (): Promise<void> => {
  console.log('Hello, World!');
};

main()
  .then(() => console.log('Done!'))
  .catch(console.error);
