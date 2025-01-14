angular.module('contactsApp')
.controller('addressbookCtrl', function($scope, $document, AddressBookService) {
	var ctrl = this;

	ctrl.t = {
		copyUrlTitle : t('contacts', 'Copy Url to clipboard'),
		edit: t('contacts', 'Rename'),
		download: t('contacts', 'Download'),
		showURL:t('contacts', 'Link'),
		shareAddressbook: t('contacts', 'Share'),
		deleteAddressbook: t('contacts', 'Delete'),
		shareInputPlaceHolder: t('contacts', 'Share with users or groups'),
		delete: t('contacts', 'Delete'),
		more: t('contacts', 'More'),
		canEdit: t('contacts', 'can edit'),
		import: t('contacts', 'Import')
	};

	ctrl.showUrl = false;
	ctrl.editing = false;
	/* globals oc_config */
	/* eslint-disable camelcase */
	ctrl.canExport = oc_config.version.split('.')[0] >= 9 || oc_config.version.split('.') >= [9, 0, 2, 0];
	/* eslint-enable camelcase */

	ctrl.openNameEditor = function () {
		ctrl.displayName = ctrl.addressBook.displayName;

		ctrl.editing = true;
	};

	ctrl.cancelNameEditor = function () {
		ctrl.displayName = '';

		ctrl.editing = false;
	};

	ctrl.saveNameEditor = function() {
		AddressBookService.rename(ctrl.addressBook, ctrl.displayName).then(function() {
			ctrl.addressBook.displayName = ctrl.displayName;
			ctrl.displayname = '';

			ctrl.editing = false;
			$scope.$apply();
		});
	};

	ctrl.toggleShowUrl = function() {
		ctrl.showUrl = !ctrl.showUrl;
	};

	ctrl.toggleSharesEditor = function() {
		ctrl.editingShares = !ctrl.editingShares;
		ctrl.selectedSharee = null;
	};

	/* From Calendar-Rework - js/app/controllers/calendarlistcontroller.js */
	ctrl.findSharee = function (val) {
		return $.get(
			OC.linkToOCS('apps/files_sharing/api/v1') + 'sharees',
			{
				format: 'json',
				search: val.trim(),
				perPage: 200,
				itemType: 'principals'
			}
		).then(function(result) {
			// Todo - filter out current user, existing sharees
			var users   = result.ocs.data.exact.users.concat(result.ocs.data.users);
			var groups  = result.ocs.data.exact.groups.concat(result.ocs.data.groups);

			var userShares = ctrl.addressBook.sharedWith.users;
			var userSharesLength = userShares.length;
			var i, j;

			// Filter out current user
			var usersLength = users.length;
			for (i = 0 ; i < usersLength; i++) {
				if (users[i].value.shareWith === OC.currentUser) {
					users.splice(i, 1);
					break;
				}
			}

			// Now filter out all sharees that are already shared with
			for (i = 0; i < userSharesLength; i++) {
				var share = userShares[i];
				usersLength = users.length;
				for (j = 0; j < usersLength; j++) {
					if (users[j].value.shareWith === share.id) {
						users.splice(j, 1);
						break;
					}
				}
			}

			// Combine users and groups
			users = users.map(function(item) {
				return {
					display: _.escape(item.value.shareWith),
					type: OC.Share.SHARE_TYPE_USER,
					identifier: item.value.shareWith
				};
			});

			groups = groups.map(function(item) {
				return {
					display: _.escape(item.value.shareWith) + ' (group)',
					type: OC.Share.SHARE_TYPE_GROUP,
					identifier: item.value.shareWith
				};
			});

			return groups.concat(users);
		});
	};

	ctrl.onSelectSharee = function (item) {
		ctrl.selectedSharee = null;
		AddressBookService.share(ctrl.addressBook, item.type, item.identifier, false, false).then(function() {
			$scope.$apply();
		});

	};

	ctrl.updateExistingUserShare = function(userId, writable) {
		AddressBookService.share(ctrl.addressBook, OC.Share.SHARE_TYPE_USER, userId, writable, true).then(function() {
			$scope.$apply();
		});
	};

	ctrl.updateExistingGroupShare = function(groupId, writable) {
		AddressBookService.share(ctrl.addressBook, OC.Share.SHARE_TYPE_GROUP, groupId, writable, true).then(function() {
			$scope.$apply();
		});
	};

	ctrl.unshareFromUser = function(userId) {
		AddressBookService.unshare(ctrl.addressBook, OC.Share.SHARE_TYPE_USER, userId).then(function() {
			$scope.$apply();
		});
	};

	ctrl.unshareFromGroup = function(groupId) {
		AddressBookService.unshare(ctrl.addressBook, OC.Share.SHARE_TYPE_GROUP, groupId).then(function() {
			$scope.$apply();
		});
	};

	ctrl.deleteAddressBook = function() {
		AddressBookService.delete(ctrl.addressBook).then(function() {
			$scope.$apply();
		});
	};

	ctrl.triggerImport = function() {
		var element = $document.find('#contact-import-' + $scope.index);
		if (element) {
			element.click();
		}
	};

	ctrl.download = function() {
		window.open(ctrl.addressBook.url + '?export');
	};

});
