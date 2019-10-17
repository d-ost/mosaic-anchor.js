
const program = require('commander');
const Web3 = require('web3');
const index = require('./index');
const Job = index.Job;

program
  .command('commit <direction> <config-file-path>')
  .action(
    async (direction, configFilePath) => {
      console.log('direction', direction);
      console.log('configFilePath', configFilePath);
      const config = require(configFilePath);
      const originWeb3 = new Web3(config.origin.chain.ws);
      const auxiliaryWeb3 = new Web3(config.auxiliary.chain.ws);
      const originAnchor = config.origin.chain.anchor;
      const auxiliaryAnchor = config.auxiliary.chain.anchor;
      const originOrganizationOwner = config.origin.chain.organizationOwner;
      const auxiliaryOrganizationOwner = config.auxiliary.chain.organizationOwner;
      const originPassword = config.origin.chain.password;
      const auxiliaryPassword = config.auxiliary.chain.password;
      const originConfirmations = 24;
      const auxiliaryConfirmations = 6;
      const originAnchorInterval = parseInt(config.origin.commitInterval) * 60 * 1000; /* minute to ms */
      const auxiliaryAnchorInterval = parseInt(config.auxiliary.commitInterval) * 60 * 1000; /* minute to ms */
      let oJob;
      if (direction === 'o2a') {
        await auxiliaryWeb3.eth.personal.unlockAccount(auxiliaryOrganizationOwner, auxiliaryPassword, 100000000);
        oJob = new Job(
          originWeb3,
          auxiliaryWeb3,
          auxiliaryAnchor,
          auxiliaryOrganizationOwner,
          auxiliaryConfirmations,
          auxiliaryAnchorInterval
        );
      } else if (direction === 'a2o') {
        await originWeb3.eth.personal.unlockAccount(originOrganizationOwner, originPassword, 100000000);
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
        oJob.execute( 50 ).on('StateRootAvailable', function ( receipt ) {
          console.log('State root has been anchored. receipt', JSON.stringify(receipt, null, 2));
        }).then(function () {
          console.log('Job completed.');
        }).catch(function ( error ) {
          console.log("Something went wrong.", error);
          process.exit(0);
        })
      } catch (e) {
        console.error('unhandled error', e);
        process.exit(0);
      }
    }
  );

program.parse(process.argv);