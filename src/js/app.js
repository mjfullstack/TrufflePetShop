App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      console.log("Modern dapp browsers selected...")
      App.web3Provider = window.ethereum;
      try {
        // Request account access... 
        // Need to explicitly request access to the accounts with...
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      console.log("Legacy dapp browsers selected...")
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache...
    // This fallback is fine for development environments, but insecure and not suitable for production.
    else {
      console.log("Ganache selected...")
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    // After above selection is completed, assign our web3 var...
    web3 = new Web3(App.web3Provider);
    console.log ("web3: ", web3 );
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Adoption.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      // Artifacts are information about our contract such as its deployed address and 
      // Application Binary Interface (ABI). The ABI is a JavaScript object defining how to 
      // interact with the contract including its variables, functions and their parameters.
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
    
      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);
    
      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: function(adopters, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      console.log("markAdopted: adoptionInstance: ", adoptionInstance );
      // console.log("markAdopted with result.receipt.from = ", result.receipt.from)

      return adoptionInstance.getAdopters.call();
      }).then(function(adopters) {
        console.log("THEN after markAdopted ALL adopters:", adopters);
        for (i = 0; i < adopters.length; i++) {
          console.log(i, ": adopters[", i, "] : ", adopters[i] );
          // if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
            if (adopters[i] !== '0x') { // NOTE: ALL array elements are "0x", NONE are the address of adopter
              $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
          }
        }
      }).catch(function(err) {
        console.log(err);
      });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0];
      console.log("Adopting Account: ", account );
    
      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;
        console.log("handleAdopt: adoptionInstance: ", adoptionInstance );
    
        // Execute adopt as a transaction by sending account
        console.log("handleAdopt: petId: ", petId, "'from' account: ", account );
        return adoptionInstance.adopt(petId, {from: account});
        }).then(function(result) {
          console.log("Entering markAdopted with result = ", result)
          console.log("Entering markAdopted with result.receipt.from = ", result.receipt.from)
          return App.markAdopted(result); // MWJ
        }).catch(function(err) {
          console.log(err.message);
        });
      });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
