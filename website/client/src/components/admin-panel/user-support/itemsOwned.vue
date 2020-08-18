<template>
  <div class="accordion-group">
    <h3
      class="expand-toggle"
      :class="{'open': expand}"
      @click="expand = !expand"
    >
      Items
    </h3>
    <div v-if="expand">
      <p>
        The sections below display each item's key (bolded if the player has ever owned it),
        followed by the item's English name.
        Use the key (not name!) to change the amount owned or the true/false value.
        Click "Change" to auto-fill "Update Items" with key and current amount/value.
      </p>

      <div
        v-for="itemType in itemTypes"
        :key="itemType"
      >
        <div class="accordion-group">
          <h4
            class="expand-toggle"
            :class="{'open': expandItemType[itemType]}"
            @click="expandItemType[itemType] = !expandItemType[itemType]"
          >
            {{ itemType }}
          </h4>
          <div v-if="expandItemType[itemType]">
            <p v-if="itemType === 'pets'">
              A value of -1 means they owned the Pet but Released it
              and have not yet rehatched it.
            </p>
            <p v-if="itemType === 'mounts'">
              A value of NULL means they owned the Mount but Released it
              and have not yet retamed it.
            </p>
            <p v-if="itemType === 'special'">
              When there are 0 of these items, we can't tell if
              they had been owned and were all used, or have never been owned.
            </p>
            <p v-if="itemType === 'gear'">
              A value of true means they own the item now and can wear it.
              A value of false means they used to own it but lost it from Death
              (or an old Rebirth).
            </p>
            <ul>
              <li
                v-for="item in collatedItemData[itemType]"
                :key="item.key"
                class="form-group form-inline"
              >
                <form
                  @submit.prevent="changeData(item.path, item.value)"
                  value="Change"
                >
                  <span>{{ item.valueForDisplay }} : </span>
                  <span :class="{ ownedItem: !item.neverOwned }">{{ item.key }} :</span>
                  <span v-html="item.name"></span>
                  <input
                    type="submit"
                    value="Change"
                    class="btn btn-primary"
                  >
                </form>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .ownedItem {
    font-weight: bold;
  }
</style>

<script>
import content from '@/../../common/script/content';
import getItemDescription from '../mixins/getItemDescription';

function collateItemData (self) {
  // items.special includes many items but we are interested in these only:
  const specialItems = ['snowball', 'spookySparkles', 'shinySeed', 'seafoam'];

  const collatedItemData = {};
  self.itemTypes.forEach(itemType => {
    let basePath = `items.${itemType}`;
    let ownedItems = self.items[itemType] || {};
    let allItems = content[itemType];
    if (itemType === 'gear') {
      basePath = 'items.gear.owned';
      ownedItems = self.items.gear.owned || {};
      allItems = content.gear.flat;
    }
    const itemData = [];

    for (const key of Object.keys(ownedItems)) {
      // Do not sort keys. The order in the items object gives hints about order received.

      if (itemType !== 'special' || specialItems.includes(key)) {
        // we want null values shown as visible text (e.g., Mounts that were Released)
        const value = ownedItems[key];
        const valueForDisplay = (value === null) ? 'NULL' : value;
        itemData.push({
          neverOwned: false,
          key,
          name: self.getItemDescription(itemType, key),
          path: `${basePath}.${key}`,
          value,
          valueForDisplay,
        });
      }
    }

    for (const key of Object.keys(allItems).sort()) {
      // These are never-owned items so we sort by key for convenient viewing.

      if (
        // ignore items the user owns because they were listed above:
        !(key in ownedItems)

        // ignore gear items that indicate empty equipped slots (e.g., head_base_0):
        && !(itemType === 'gear' && content.gear.flat[key].set
          && content.gear.flat[key].set === 'base-0')

        // ignore "special" items that aren't Snowballs, Seafoam, etc:
        && (itemType !== 'special' || specialItems.includes(key))
      ) {
        // these types of items have true/false/null values (all other have integers):
        const booleanTypes = ['mounts', 'gear'];

        let value;
        let valueForDisplay;
        if (booleanTypes.includes(itemType)) {
          value = ''; // we want no default value in the "Update Items" input box
          valueForDisplay = 'never owned';
        } else {
          value = 0;
          valueForDisplay = '0 (never owned)';
        }
        itemData.push({
          neverOwned: true,
          key,
          name: self.getItemDescription(itemType, key),
          path: `${basePath}.${key}`,
          value,
          valueForDisplay,
        });
      }
    }
    collatedItemData[itemType] = itemData;
  });
  return collatedItemData;
}

function resetData (self) {
  self.collatedItemData = collateItemData(self);
  self.itemTypes.forEach(itemType => { self.expandItemType[itemType] = false; });
}

export default {
  mixins: [
    getItemDescription,
  ],
  props: {
    resetCounter: {
      type: Number,
      required: true,
    },
    items: {
      type: Object,
      required: true,
    },
  },
  data () {
    return {
      expand: false,
      expandItemType: {
        eggs: false,
        hatchingPotions: false,
        food: false,
        pets: false,
        mounts: false,
        quests: false,
        gear: false,
        special: false,
      },
      itemTypes: ['eggs', 'hatchingPotions', 'food', 'pets', 'mounts', 'quests', 'gear', 'special'],
      collatedItemData: {},
    };
  },
  watch: {
    resetCounter () {
      resetData(this);
    },
  },
  mounted () {
    resetData(this);
  },
  methods: {
    changeData (path, currentValue) {
      // XXX @TODO improve this, update all docs above, see if clear-data is needed
      this.expandUpdateItems = true;
      this.expandItems = true;
      this.hero.itemPath = path;
      this.hero.itemVal = currentValue;
    },
  },
};
</script>
