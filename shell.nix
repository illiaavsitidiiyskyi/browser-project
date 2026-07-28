{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.glib
    pkgs.nss
    pkgs.gtk3
    pkgs.xorg.libXScrnSaver
    pkgs.alsa-lib
    pkgs.nodejs
  ];
}