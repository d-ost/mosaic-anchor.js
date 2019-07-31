
const program = require('commander');
const Web3 = require('web3');
const index = require('./index');
const Job = index.Job;

const originAnchor = '0x4fDF26dc9a99D11FfB39a2d88a7E39E49544602a';
const auxiliaryAnchor = '0x2Bbe4DFb364e76dA987Ac5754bB87b476cC6D80B';
const originOrganizationOwner = '0x970cadd1c487c66b05ef108e506ae16ae471cf04';
const auxiliaryOrganizationOwner = '0x9f668fc260c442cb41bf312ba48ae6571e7d08fe';
const originConfirmations = 24;
const auxiliaryConfirmations = 6;
const originAnchorInterval = 60 * 60 * 1000; /* 60 minute */
const auxiliaryAnchorInterval = 0.5 * 60 * 1000; /* 0.5 minute */

program
  .command('commit <direction>')
  .action(
    async (direction) => {
      console.log('direction',direction);
      let oJob;
      if (direction === 'o2a') {
        const originWeb3 = new Web3('ws://34.244.36.178:50005');
        const auxiliaryWeb3 = new Web3('ws://10.25.17.99:8546');
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
        const auxiliaryWeb3 = new Web3('ws://34.243.117.168:51405');
        const originWeb3 = new Web3('ws://10.25.10.65:50005');
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
      const iterations = 1000;
      oJob.execute( iterations ).on('StateRootAvailable', function ( receipt ) {
        console.log('State root has been anchored. receipt', JSON.stringify(receipt, null, 2));
      }).then(function () {
        console.log('Job completed.');
      }).catch(function ( error ) {
        console.log("Something went wrong.", error);
      })
    }
  );

program.parse(process.argv);