noop = require('core/utils/utils').noop;
var inherit = require('core/utils/utils').inherit;
var G3WObject = require('core/g3wobject');

// rappresenta l'interfaccia globale dell'API della GUI. 
// metodi devono essere implementati (definiti) dall'applicazione ospite
// l'app ospite dovrebbe chiamare anche la funzione GUI.ready() quando la UI è pronta
function GUI(){
  // url delle risorse
  this.getResourcesUrl = noop;
  // show a Vue form
  this.showForm = noop;
  this.closeForm = noop;
  
  // mostra una lista di oggetti (es. lista di risultati)
  this.showListing = noop;
  this.closeListing = noop;
  this.hideListing = noop;

  this.showPanel = noop;
  
  this.ready = function(){
    this.emit('guiready');
  };
  
  this.guiResized = function(){
    this.emit('guiresized');
  };
  
  this.showSpinner = noop; // per mostrare un'icona spinner che notifica un caricamento dati in corso
  this.hideSpinner = noop;
  
  toastr.options.positionClass = 'toast-top-center';
  toastr.options.preventDuplicates = true;
  // proxy della libreria toastr
  this.notify = toastr;
  this.dialog = bootbox;
}
inherit(GUI,G3WObject);

module.exports = new GUI;