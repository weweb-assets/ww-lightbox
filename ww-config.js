export default {
  editor: {
    label: {
      en: "Lightbox",
    },
  },
  properties: {
    triggerContainer: {
      hidden: true,
      defaultValue: [],
      navigator: {
        group: "Lightbox link",
      },
    },
    contentContainer: {
      hidden: true,
      defaultValue: [],
      navigator: {
        group: "Lightbox content",
      },
    },
    closeIcon: {
      hidden: true,
      defaultValue: { isWwObject: true, type: "ww-icon", name: "Close icon" },
    },
    explorerArrows: {
      hidden: true,
      defaultValue: [
        { isWwObject: true, type: "ww-icon" },
        { isWwObject: true, type: "ww-icon" },
      ],
    },
    toggleEdition: {
      type: "Button",
      label: null,
      options: {
        text: {
          en: "Toggle edition",
        },
        action: "handlerExplorer",
      },
    },
    mediaElements: {
      hidden: true,
      defaultValue: [{ isWwObject: true, type: "ww-image" }],
    },
    miniatureElement: {
      hidden: true,
      defaultValue: { isWwObject: true, type: "ww-image" },
    },
    medias: {
      label: { en: "Medias", fr: "Medias" },
      type: "Array",
      options: {
        item: {
          type: "Object",
          options: {
            item: {
              media: {
                type: "TextSelect",
                label: {
                  en: "Type",
                  fr: "Type",
                },
                options: {
                  options: [
                    {
                      value: "ww-video",
                      label: { en: "Video", fr: "Video" },
                    },
                    {
                      value: "ww-image",
                      label: { en: "Image", fr: "Image" },
                    },
                  ],
                },
                defaultValue: "ww-image",
              },
              miniature: {
                type: "Image",
                label: {
                  en: "Miniature image",
                  fr: "Miniature image",
                },
                bindable: true,
                defaultValue: "",
              },
            },
          },
        },
        onRemove: "onMediaRemove",
        onAdd: "onMediaAdded",
      },
      defaultValue: [{ media: "ww-image" }],
    },
    mediaIndex: {
      label: { en: "Media index", fr: "Media index" },
      type: "Tabs",
      editorOnly: true,
      options: (content) => {
        return {
          labels: content.medias.map((_, index) => {
            return {
              label: `Media ${index + 1}`,
            };
          }),
          prefixLabel: "Slide",
          nbTabs: content.medias.length,
          bound: true,
        };
      },
      defaultValue: 0,
    },
    backdropColor: {
      type: "Color",
      label: {
        en: "Backdrop color",
        fr: "Backdrop color",
      },
      options: {
        nullable: true,
        gradient: true,
      },
      defaultValue: "#000000",
      bindable: true,
    },
    linked: {
      type: "OnOff",
      label: {
        en: "Link with other lightboxes",
        fr: "Link with other lightboxes",
      },
      defaultValue: false,
    },
    group: {
      hidden: (content) => !content.linked,
      label: { en: "lightbox group" },
      type: "Text",
      options: {
        placeholder: "Groupe name",
      },
      defaultValue: "",
      bindable: true,
    },
  },
};
