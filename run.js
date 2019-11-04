const program = require('commander');
const Web3 = require('web3');
const fs = require('fs');
const index = require('./index');
const Job = index.Job;

program
  .command('commit <direction> <config-file-path> <password>')
  .action(async (direction, configFilePath, password) => {
    console.log('direction', direction);
    console.log('configFilePath', configFilePath);
    const config = require(configFilePath);
    const originWeb3 = new Web3(config.origin.chain.ws);
    const auxiliaryWeb3 = new Web3(config.auxiliary.chain.ws);
    const originAnchor = config.origin.chain.anchor;
    const auxiliaryAnchor = config.auxiliary.chain.anchor;
    const originOrganizationOwner = config.origin.chain.organizationOwner;
    const auxiliaryOrganizationOwner = config.auxiliary.chain.organizationOwner;
    const originConfirmations = 24;
    const auxiliaryConfirmations = 6;
    const originAnchorInterval = parseInt(config.origin.commitInterval) * 60 * 1000; /* minute to ms */
    const auxiliaryAnchorInterval = parseInt(config.auxiliary.commitInterval) * 60 * 1000; /* minute to ms */
    let oJob;
    if (direction === 'o2a') {
      const account = auxiliaryWeb3.eth.accounts.decrypt(config.auxiliary.signer, password);
      auxiliaryWeb3.eth.accounts.wallet.add(account);
      oJob = new Job(
        originWeb3,
        auxiliaryWeb3,
        auxiliaryAnchor,
        auxiliaryOrganizationOwner,
        auxiliaryConfirmations,
        auxiliaryAnchorInterval
      );
    } else if (direction === 'a2o') {
      const account = originWeb3.eth.accounts.decrypt(config.origin.signer, password);
      originWeb3.eth.accounts.wallet.add(account);
      oJob = new Job(
        auxiliaryWeb3,
        originWeb3,
        originAnchor,
        originOrganizationOwner,
        originConfirmations,
        originAnchorInterval
      );
    } else {
      throw `unknown direction ${direction}`;
    }
    try {
      oJob
        .execute(50)
        .on('StateRootAvailable', function(receipt) {
          console.log('State root has been anchored. receipt', JSON.stringify(receipt, null, 2));
        })
        .then(function() {
          console.log('Job completed. Exiting!');
          process.exit(1);
        })
        .catch(function(error) {
          console.log('Something went wrong.', error);
          process.exit(0);
        });
    } catch (e) {
      console.error('unhandled error', e);
      process.exit(0);
    }
  });

program
  .command('createWorker <chain> <config-file-path>' + ' <password>')
  .action(async (chain, configFilePath, password) => {
    if (!(chain === 'origin' || chain === 'auxiliary')) {
      console.log(`Valid chain parameter value is ${chain}`);
      process.exit(1);
    }

    const web3 = new Web3('');
    const account = web3.eth.accounts.create();
    const encryptedAccount = web3.eth.accounts.encrypt(account.privateKey, password);
    let configObject = require(configFilePath);
    configObject[chain]['signer'] = encryptedAccount;
    fs.writeFileSync(configFilePath, JSON.stringify(configObject, null, '  '));
    console.log(`Created worker address ${account.address} for chain ${chain}`);
  });
program.parse(process.argv);
