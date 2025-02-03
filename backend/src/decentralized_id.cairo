// SPDX-License-Identifier: MIT
#[starknet::interface]
pub trait IDecentralizedId<TContractState> {
    #[external(v0)]
    fn safe_mint(
        ref self: TContractState,
        recipient: starknet::ContractAddress,
        token_id: u256,
        uri: felt252,
    );
    #[external(v0)]
    fn get_token_uri(self: @TContractState, token_id: u256) -> felt252;
    #[external(v0)]
    fn get_owner_of(self: @TContractState, token_id: u256) -> starknet::ContractAddress;
    #[external(v0)]
    fn transfer(
        ref self: TContractState,
        from: starknet::ContractAddress,
        to: starknet::ContractAddress,
        token_id: u256,
    );
}


#[starknet::contract]
pub mod DecentralizedId {
    use super::IDecentralizedId;
    use openzeppelin_token::erc721::ERC721Component;
    use openzeppelin_token::erc721::ERC721Component::InternalTrait as ERC721InternalTrait;
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_access::ownable::OwnableComponent::InternalTrait as OwnableInternalTrait;
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::ContractAddress;
    use starknet::storage::{StorageMapReadAccess, StorageMapWriteAccess, Map};
    use core::num::traits::Zero;
    use core::array::{ArrayTrait, ToSpanTrait};


    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    // External
    #[abi(embed_v0)]
    impl ERC721Impl = ERC721Component::ERC721MetadataCamelOnlyImpl<ContractState>;

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;

    impl ERC721HooksEmptyImpl of ERC721Component::ERC721HooksTrait<ContractState> {}

    #[storage]
    struct Storage {
        owner_of: Map<u256, ContractAddress>,
        token_uri: Map<u256, felt252>,
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    pub mod Errors {
        pub const TokenAlreadyMinted: felt252 = 'Token already minted';
        pub const NonTransferable: felt252 = 'SBTs are non-transferable';
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        let name = "DecentralizedId";
        let symbol = "DID";
        let base_uri = "indigo-hidden-meerkat-77.mypinata.cloud";

        self.erc721.initializer(name, symbol, base_uri);
        self.ownable.initializer(owner);
    }


    #[abi(embed_v0)]
    impl DecentralizedIdImpl of IDecentralizedId<ContractState> {
        fn safe_mint(
            ref self: ContractState, recipient: ContractAddress, token_id: u256, uri: felt252,
        ) {
            self.ownable.assert_only_owner();
            let current_owner = self.owner_of.read(token_id);
            assert(current_owner.is_zero(), Errors::TokenAlreadyMinted);

            self.owner_of.write(token_id, recipient);
            self.token_uri.write(token_id, uri);
            let data: Array<felt252> = array![]; // Pas de data car pas de onERC721Received
            self.erc721.safe_mint(recipient, token_id.into(), data.span());
        }

        fn get_token_uri(self: @ContractState, token_id: u256) -> felt252 {
            self.token_uri.read(token_id)
        }

        fn get_owner_of(self: @ContractState, token_id: u256) -> ContractAddress {
            self.owner_of.read(token_id)
        }

        fn transfer(
            ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u256,
        ) {
            panic(array![Errors::NonTransferable]);
        }
    }
}
