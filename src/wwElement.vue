<template>
  <div class="ww-lightbox" :style="cssVariables">
    <div class="ww-lightbox__trigger" @click="handlerExplorer">
      <wwLayout :path="`triggerContainer`">
        <template #default="{ item }">
          <wwLayoutItem>
            <wwElement v-bind="item" />
          </wwLayoutItem>
        </template>
      </wwLayout>
    </div>
    <div class="ww-lightbox__content" v-show="isExplorerVisible && isEditing">
      <div class="content-container" ref="contentContainer">
        <div v-for="(el, index) in content.mediaElements" :key="index">
          <div v-show="index === contentIndex">
            <wwElement
              data-lightbox-media
              :data-lightbox-group="content.group"
              :data-lightbox-linked="content.linked"
              :data-lightbox-id="id"
              v-bind="el"
            />
          </div>
        </div>
      </div>
      <div class="ww-lightbox__content-summary" v-if="!isExplorerVisible">
        <div class="summary-item">
          <wwElement
            v-bind="content.miniatureElement"
            :wwProps="{ url: content.medias[contentIndex].miniature }"
          />
        </div>
      </div>
    </div>
    <div class="ww-lightbox__explorer" v-show="isExplorerVisible && !isEditing">
      <div class="close-button" @click="handlerExplorer" explorer-navigation>
        <wwElement v-bind="content.closeIcon" />
      </div>
      <!-- TODO fix transition -->
      <div class="ww-lightbox__explorer-content">
        <TransitionGroup :name="activeTransition" mode="out-in">
          <template v-for="(element, index) in explorerContent">
            <div
              class="content-container"
              v-if="index === lightboxIndex"
              v-html="element.outerHTML"
              :key="`item-${index}`"
            />
          </template>
        </TransitionGroup>
      </div>
    </div>
    <div v-show="showPrev" class="explorer-nav -prev" @click="explorerPrev">
      <wwElement v-bind="content.explorerArrows[0]" />
    </div>
    <div v-show="showNext" class="explorer-nav -next" @click="explorerNext">
      <wwElement v-bind="content.explorerArrows[1]" />
    </div>
    <div class="ww-lightbox__summary" v-if="isExplorerVisible">
      <div
        class="summary-item"
        v-for="(item, index) in content.miniaturesUrl"
        :key="index"
        @click="changeIndex(index)"
      >
        <wwElement
          v-bind="content.miniatureElement"
          :wwProps="{ url: item.miniature }"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    content: { type: Object, required: true },
    wwFrontState: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  data() {
    return {
      isExplorerVisible: false,
      observer: null,
      lightboxIndex: 0,
      contentIndex: 0,
      explorerContent: [],
      activeTransition: "fadeLeft",
    };
  },
  watch: {
    isEditing(val) {
      if (val === false) this.isExplorerVisible = false;

      this.contentIndex = 0;
      this.lightboxIndex = 0;
    },
    "content.medias": {
      deep: true,
      async handler(newMedias, oldMedias) {
        if (newMedias && oldMedias && newMedias.length !== oldMedias.length)
          return;

        newMedias.forEach(async (media, index) => {
          if (media && oldMedias[index]) {
            if (media.media !== oldMedias[index].media) {
              const mediaElements = this.content.mediaElements;
              const elem = await wwLib.createElement(
                media.media,
                {},
                {},
                this.wwFrontState.sectionId
              );
              mediaElements[index] = elem;
              this.$emit("update:content", { mediaElements });
            }

            // TODO All element need to share the same object
            // if (media.miniature !== oldMedias[index].miniature) {
            //   const url = await wwLib.wwUtils.transformToTwicPics(
            //     newMedias[index].miniature || ""
            //   );
            //   wwLib.$emit("ww-lightbox-update:miniatures", this.id, url);
            // }
          }
        });
      },
    },
    "wwEditorState.sidepanelContent.mediaIndex"(index) {
      this.isExplorerVisible = true;
      this.lightboxIndex = index;
    },
  },
  computed: {
    isEditing() {
      /* wwEditor:start */
      return (
        this.wwEditorState.editMode === wwLib.wwEditorHelper.EDIT_MODES.EDITION
      );
      /* wwEditor:end */
      // eslint-disable-next-line no-unreachable
      return false;
    },
    id() {
      return `ww-lightbox-${wwLib.wwUtils.getUniqueId()}`;
    },
    showPrev() {
      return !!this.explorerContent[this.lightboxIndex - 1];
    },
    showNext() {
      return !!this.explorerContent[this.lightboxIndex + 1];
    },
    cssVariables() {
      return {
        "--backdrop-color": this.content.backdropColor,
      };
    },
  },
  methods: {
    async handlerExplorer() {
      if (!this.isExplorerVisible) this.handleLightboxes();
      else this.destroyExplorer();

      this.$nextTick(() => {
        this.isExplorerVisible = !this.isExplorerVisible;
      });
    },
    handleLightboxes() {
      const lightboxes = wwLib
        .getFrontDocument()
        .querySelectorAll("[data-lightbox-media]");

      // TODO Get the element position in the list
      // const list = Array.prototype.slice.call(lightboxes);
      // const indexInList = list.indexOf(
      //   list.find((el) => el.getAttribute("data-lightbox-id") === this.id)
      // );

      // console.log(indexInList);

      this.destroyExplorer();

      for (let node of lightboxes) {
        const nodeId = node.getAttribute("data-lightbox-id");
        const nodeGroup = node.getAttribute("data-lightbox-group");
        const linked = node.getAttribute("data-lightbox-linked");

        if (!linked) continue;
        if (!this.content.group.length && nodeGroup !== this.content.group)
          continue;
        if (nodeId === this.id) continue;

        const clone = node.cloneNode(true);
        clone.removeAttribute("data-lightbox-media");
        this.explorerContent.push(clone);
      }
    },
    destroyExplorer() {
      this.explorerContent = [];
    },
    onMediaRemove(index) {
      const mediaElements = [...this.content.mediaElements];
      mediaElements.splice(index, 1);

      const miniaturesUrl = [...this.content.miniaturesUrl];
      miniaturesUrl.splice(index, 1);

      this.$emit("update:content", { mediaElements, miniaturesUrl });
    },
    async onMediaAdded() {
      const mediaElements = [...this.content.mediaElements];
      if (mediaElements.length === 0) {
        const elem = await wwLib.createElement(
          "ww-image",
          {},
          {},
          this.wwFrontState.sectionId
        );
        mediaElements.push(elem);
      } else {
        const elem = await wwLib.wwObjectHelper.cloneElement(
          mediaElements[mediaElements.length - 1].uid,
          this.wwFrontState.sectionId
        );
        mediaElements.push(elem);
      }
      this.$emit("update:content", { mediaElements });
    },
    changeIndex(index) {
      this.activeTransition =
        index > this.lightboxIndex ? "fadeLeft" : "fadeRight";
      this.lightboxIndex = index;
    },
    explorerPrev() {
      if (!!this.explorerContent[this.lightboxIndex - 1]) {
        this.changeIndex(this.lightboxIndex - 1);
      }
    },
    explorerNext() {
      if (!!this.explorerContent[this.lightboxIndex + 1]) {
        this.changeIndex(this.lightboxIndex + 1);
      }
    },
    updateMiniatures(id, url) {
      console.log(this.content.miniaturesUrl);
      const miniaturesUrl = { ...this.content.miniaturesUrl };
      miniaturesUrl[id] = { miniature: url };
      this.$emit("update:content", { miniaturesUrl });
      console.log(this.content.miniaturesUrl);
    },
  },
  beforeUnmount() {
    wwLib.$off("ww-lightbox-update:miniatures", this.updateMiniatures);
  },
  mounted() {
    this.handleLightboxes();
  },
  created() {
    wwLib.$on("ww-lightbox-update:miniatures", this.updateMiniatures);
  },
};
</script>

<style lang="scss" scoped>
.ww-lightbox {
  // Layout : display flex column

  position: inherit;

  &__trigger {
    padding: 10px;
    border: 10px solid lightcoral;
  }

  &__explorer {
    z-index: 3;
    display: flex;
    direction: columns;
    justify-content: center;
    align-items: center;

    .close-button {
      position: absolute;
      top: 20px;
      right: 20px;

      cursor: pointer;
      z-index: 10000;
      border: 1px solid black;
      background-color: white;
    }

    position: fixed;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;

    background-color: var(--backdrop-color);

    &-content {
      width: 100%;
    }
  }

  &__content {
    z-index: 3;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
    position: fixed;
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;

    background-color: var(--backdrop-color);
  }

  .explorer-nav {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);

    cursor: pointer;
    z-index: 10000;
    border: 1px solid black;
    background-color: white;

    &.-prev {
      left: 0px;
    }

    &.-next {
      right: 0px;
    }
  }

  &__summary {
    z-index: 100;
    position: fixed;
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);

    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .summary-item {
      min-width: 40px;
    }
  }
}

// FADE LEFT
.fadeLeft-enter-active,
.fadeLeft-leave-active {
  transition: all 0.4s;
}
.fadeLeft-enter-from,
.fadeLeft-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
// FADE RIGHT
.fadeRight-enter-active,
.fadeRight-leave-active {
  transition: all 0.4s;
}

.fadeRight-enter-from,
.fadeRight-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
