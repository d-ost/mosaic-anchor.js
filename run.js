
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
      const originConfirmations = 24;
      const auxiliaryConfirmations = 6;
      const originAnchorInterval = 60 * 60 * 1000; /* 60 minute */
      const auxiliaryAnchorInterval = 0.5 * 60 * 1000; /* 0.5 minute */
      let oJob;
      if (direction === 'o2a') {
        auxiliaryWeb3.eth.personal.unlockAccount(auxiliaryOrganizationOwner, 'password', 100000000);
        oJob = new Job(
          originWeb3,
          auxiliaryWeb3,
          auxiliaryAnchor,
          auxiliaryOrganizationOwner,
          auxiliaryConfirmations,
          auxiliaryAnchorInterval
        );
      } else if (direction === 'a2o') {
        originWeb3.eth.personal.unlockAccount(originOrganizationOwner, 'password', 100000000);
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
      oJob.execute( 1000 ).on('StateRootAvailable', function ( receipt ) {
        console.log('State root has been anchored. receipt', JSON.stringify(receipt, null, 2));
      }).then(function () {
        console.log('Job completed.');
      }).catch(function ( error ) {
        console.log("Something went wrong.", error);
      })
    }
  );

program.parse(process.argv);