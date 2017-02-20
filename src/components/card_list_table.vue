"use strict";

var template = `
<div>
	<table class="card-list" v-bind:style="{ 'min-width': tableWidth + 'px' }">
		<thead v-bind:class="{ sortReversed: sortReversed }">
			<tr>
				<th class="left-buffer" v-on:click.stop="resetSort()">\u25A0</th>
				<th v-for="field in fields" v-bind:style="{ 'min-width': field.width + 'px', 'width': (field.width/tableWidth*100) + '%' }" v-on:click.stop="onColumnClick(field)" v-bind:class="{ active: sortField === field }">
					{{ field.name }}
				</th>
			</tr>
		</thead>
		<tbody>
			<card-row v-for="card in sortedCards" :key="card.id" :card="card" :fields="fields" v-on:click.stop="onRowClick(card)" :active="value === card.id"></card-row>
		</tbody>
	</table>
	<div class="below-card-list">
		<button v-on:click.stop="newCard">+ Add Card</button>
	</div>
</div>
`;

//<script>
const Vue = require("vue/dist/vue");
require("./card_row");

Vue.component("card-list-table", {
	template: template,
	props: ["cards", "fields", "value"],
	data: function() {
		return {
			sortField: null,
			sortReversed: false,
			sortedCards: null
		};
	},
	computed: {
		tableWidth: function() {
			if (!this.fields) return 1;
			return Object.keys(this.fields).reduce((s,fieldId) => { return s + this.fields[fieldId].width; }, 0);
		},
	},
	methods: {
		onRowClick: function(card) {
			this.$emit("input", card.id);
		},
		onColumnClick: function(field) {
			if (this.sortField === field) {
				this.sortReversed = !this.sortReversed;
			} else {
				this.sortField = field;
			}
		},
		resetSort: function() {
			this.sortField = null;
			this.sortReversed = false;
		},
		doSort: function() {
			// This is in an explicit watch-method instead of a computed in order to avoid re-sorting rows when card content changes.
			if (this.cards === null) return null;
			let cardsArray = Object.keys(this.cards).map((cardId) => { return this.cards[cardId]; });
			let name = this.sortField ? this.sortField.id : "id";
			let reversed = !!this.sortReversed;
			cardsArray.sort((a, b) => {
				if (a instanceof Array && b instanceof Array) {
					a = a.join("");
					b = b.join("");
				}
				if (a[name] > b[name]) {
					return reversed ? -1 : 1;
				} else if (a[name] < b[name]) {
					return reversed ? 1 : -1;
				} else {
					return 0;
				}
			});
			return cardsArray;
		},
		newCard: function() {
			alert("To do");
			// this.resetSort();
			// let id;
			// let card = createCard(this.cards.map((c) => { return c.id }), this.fields);
			// this.cards.push(card);
			// this.sortedCards = this.doSort();
			// this.$emit("input", card);
			// // Let Vue re-render before setting focus to the new card
			// setTimeout(() => {
			// 	this.$el.querySelector(".card-list > tbody > tr.active input").focus();
			// }, 50);
		}
	},
	watch: {
		sortField: {
			handler: function() {
				this.sortedCards = this.doSort();
			},
			immediate: true
		},
		sortReversed: {
			handler: function() {
				this.sortedCards = this.doSort();
			},
			immediate: true
		}
	}
});
//</script>
