App.module("Worksheet", function(Worksheet, App, Backbone, Marionette, $, _) {

    Worksheet.TemplateView = Marionette.LayoutView.extend({
        template: 'worksheet/template',

        className: function() {
            var format = App.data.user_settings.get('template_format') || 'large';
            return 'formula-list-item ' + format;
        },

        sizeSettings: {
            'large': {
                columns: 6,
                drawingSize: 105
            },

            'condensed': {
                columns: 10,
                drawingSize: 65
            },

            'two-col': {
                columns: 4,
                drawingSize: 50
            }
        },

        initialize: function() {
            this.strokeCount = this.collectStrokeCount();
            this.format = App.data.user_settings.get('template_format') || 'large';
        },

        regions: {
            'strokes': '.stroke-order',
            'practice': '.practice-grid'
        },

        ui: {
            'strokeOrder': '.stroke-order'
        },

        serializeData: function() {
            return _.extend({
                format: this.format
            }, this.model.toJSON());
        },

        onBeforeShow: function() {
            this.strokes.show(new App.Views.Charts.StrokeOrderSVG(_.extend({
                model: this.model,
                strokes: this.strokeCount
            }, this.sizeSettings[this.format])));
        },

        collectStrokeCount: function() {
            var data = this.model.toJSON(),
                id = data.id,
                svg = data.svg,
                count = 0;

            function traverseChildren (arr) {
                _.each(arr, function(obj) {
                    if(obj['path']) {
                        count += obj['path'].length;
                    }

                    if(obj['g']) {
                        traverseChildren(obj['g']);
                    }
                });
            }

            if(svg['g']) {
                traverseChildren(svg['g']);
            }

            if(svg['path']) {
                count += svg.path.length;
            }

            return count;
        }
    });


    Worksheet.TemplateList = Marionette.CollectionView.extend({
        childView: Worksheet.TemplateView
    });

    Worksheet.BaseView = Marionette.LayoutView.extend({
        template: 'worksheet/base',

        regions: {
            'list': '.formula-list'
        },

        onBeforeShow: function() {
            this.list.show(new Worksheet.TemplateList({
                collection: this.collection
            }));
        }
    });

    App.on('before:start', function() {
        App.commands.setHandler('show:worksheet', function() {

            App.mainRegion.show(new App.Views.Loader());

            App.data.key.getFormulae(App.data.itemQueue, function(err, formulaList) {
                if(err) {
                    return App.router.navigate('index', { trigger: true });
                }

                App.mainRegion.show(new Worksheet.BaseView({
                    collection: formulaList
                }));
            });

        });
    });
});