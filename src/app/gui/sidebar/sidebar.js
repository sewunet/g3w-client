import ApplicationState from 'core/applicationstate';
const t = require('core/i18n/i18n.service').t;
const {base, inherit} = require('core/utils/utils');
const Stack = require('gui/utils/utils').barstack;
const G3WObject = require('core/g3wobject');
const compiledSideBarItemTemplate = Vue.compile(require('./sidebar-item.html'));
const SIDEBAREVENTBUS = new Vue();

//sidebar item is a <li> dom element of the sidebar . Where is possible set
//title, icon type etc ..  is possible to customize component
const SidebarItem = Vue.extend({
  ...compiledSideBarItemTemplate,
  data: function() {
    return {
        info: this.$options.info || {
          state: null,
          style: null,
          class: null
        },
        main: true,
        component: this.$options.component,
        active: false,
        title: '',
        open: false,
        icon: null,
        iconColor: null,
        collapsible: null
      };
  },
  methods: {
    onClickItem(evt) {
      // force to close
      this.component.isolate && evt.stopPropagation();
      if (!this.component.isolate) {
        // set state of opened component
        this.$options.service.state.components.forEach(component => {
          if (component !== this.component) {
            if (component.getOpen()) {
              component.click({
                open:component.isolate
              });
            }
          }
        });
        !this.component.collapsible && isMobile.any && SIDEBAREVENTBUS.$emit('sidebaritemclick');
      }
      this.component.setOpen(!this.component.state.open);
    }
  },
  created() {
    this.component.openClose = () => this.$refs.anchor_click.click();
  },
  async mounted() {
    await this.$nextTick();
    $('.sidebaritem .action[data-toggle="tooltip"]').tooltip();
  }
});

function SidebarService() {
  //set sidebar stack
  this.stack = new Stack();
  // set setter for close sidebarpanel to catch event
  // of closing panel of the sidebar
  this.setters = {
    closeSidebarPanel: function() {},
    openCloseItem: function(bool) {}
  };
  //service state
  this.state = {
    components: [],
    gui: {
      title: ''
    },
    disabled: false
  };
  //inizialize method
  this.init = function(layout) {
    this.layout = layout;
  };
  // add component to sidebar
  this.addComponents = function(components, options={}) {
    //for each component of the sidebar it is call addComponent method
    components.forEach(component => this.addComponent(component, options));
    return true;
  };
  // add each component to the sidebar
  // add also position insiede the sidebar
  this.addComponent = function(component, options={}) {
    const {position, info} = options;
    if (isMobile.any && !component.mobile) {
      return false
    }
    const sidebarItem = new SidebarItem({
      service: this,
      info,
      component
    });
    sidebarItem.title = component.title || sidebarItem.title;
    sidebarItem.info = component.info || sidebarItem.info;
    sidebarItem.actions = component.actions || sidebarItem.actions;
    sidebarItem.open = component.state.open; //(component.open === undefined) ? sidebarItem.open : component.open;
    sidebarItem.icon = component.icon || sidebarItem.icon;
    sidebarItem.iconColor = component.iconColor;
    sidebarItem.state = component.state || true;
    sidebarItem.collapsible = (typeof component.collapsible === 'boolean') ? component.collapsible : true;
    sidebarItem.isolate = (typeof component.isolate === 'boolean') ? component.isolate: false;
    //append component to  g3w-sidebarcomponents (template sidebar.html)
    const DOMComponent = sidebarItem.$mount().$el;
    this.state.components.push(component);
    const children = $('#g3w-sidebarcomponents').children(':visible');
    const childrenLength = children.length;
    if (position === null || position === undefined || position < 0 || position >= childrenLength) $('#g3w-sidebarcomponents').append(DOMComponent);
    else children.each(function (index, element) {position === index && $(DOMComponent).insertBefore(element)});
    //mount componet to g3w-sidebarcomponent-placeholder (template sidebar-item.html);
    component.mount("#g3w-sidebarcomponent-placeholder");
    // check if componentonent has iniService method
    component.initService && component.initService();
    // add click handler
    this.setComponentClickHandler(component);
    return true;
  };

  this.setComponentClickHandler = function(component){
    component.click = ({open=false}={}) => {
      open = open || false;
      $(component.getInternalComponent().$el).siblings('a').click();
      component.setOpen(open);
    }
  };

  // get component by id
  this.getComponent = function(id) {
    return this.state.components.find(component => component.getId() === id)
  };

  // get all components
  this.getComponents = function() {
    return this.state.components;
  };

  this.closeOpenComponents = function(){
    this.getComponents().forEach(component =>{
      component.getOpen() && component.click({open: false});
    })
  };

  this.reloadComponent = function(id) {
    const component = this.getComponent(id);
    component && component.reload();
  };

  this.reloadComponents = function() {
    // force close of the panel
    this.closePanel();
    this.state.components.forEach(component => {
      if (component.collapsible && component.state.open) component.click({open: false});
      component.reload();
    })
  };
  //remove component
  this.removeComponent = function(component, options={}) {
    const {position} = options;
    this.state.components.forEach((sidebarComponent, index) => {
      if (component === sidebarComponent) {
        component.unmount();
        this.state.components.splice(index, 1);
        if (position !== undefined) $('#g3w-sidebarcomponents').children(':visible')[position].remove();
        else $('#g3w-sidebarcomponents').children(`#${component.id}`).remove();
        return false;
      }
    })
  };
  // show panel on stack
  this.showPanel = function(panel) {
    return new Promise((resolve, reject) => {
      this.state.gui.title = panel.title;
      const parent = "#g3w-sidebarpanel-placeholder";
      this.stack.push(panel, {
        parent: parent
      }).then(content => resolve(content))
    })
  };

  // close panel
  this.closePanel = function() {
    this.closeSidebarPanel();
    this.stack.pop().then(content => content = null);
  };
  base(this);
}

inherit(SidebarService, G3WObject);

const sidebarService = new SidebarService;
const compiledSideBarTemplate = Vue.compile(require('./sidebar.html'));
const SidebarComponent = Vue.extend({
    ...compiledSideBarTemplate,
    data: function() {
    	return {
        components: sidebarService.state.components,
        panels: sidebarService.stack.state.contentsdata,
        bOpen: true,
        bPageMode: false,
        header: t('main navigation'),
        state: sidebarService.state
      }
    },
    computed: {
      disabled(){
        return ApplicationState.gui.sidebar.disabled;
      },
      panelsinstack: function(){
        return this.panels.length > 0;
      },
      showmainpanel: function(){
        return this.components.length>0 && !this.panelsinstack;
      },
      componentname: function(){
        return this.components.length ? this.components.slice(-1)[0].getTitle(): "";
      },
      panelname: function(){
        let name = "";
        if (this.panels.length){
          name = this.panels.slice(-1)[0].content.getTitle();
        }
        return name;
      }
    },
    methods: {
      closePanel: function() {
        sidebarService.closePanel();
      }
    },
    created() {
      this.iframe = ApplicationState.iframe;
      SIDEBAREVENTBUS.$on('sidebaritemclick', ()=> $('.sidebar-toggle').click())
    }
});

module.exports = {
  SidebarService: sidebarService,
  SidebarComponent
};
