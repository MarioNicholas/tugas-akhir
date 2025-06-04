// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Tiket is ReentrancyGuard {
    address public owner;
    uint256 public totalTiket;
    uint256 public tiketTerjual;
    uint256 public maxTiketPerIdentitas;
    uint256 public holdDuration = 300;
    uint256 public nextHoldId = 1;
    uint256 public hargaTiket;

    struct TiketDetail {
        bytes32 nikHash;
        string kodeUnik;
        bool digunakan;
    }

    struct HoldTiket {
        uint256 jumlahTiket;
        uint256 holdTimestamp;
        bool aktif;
    }

    mapping(uint256 => HoldTiket) public holdTiketData;
    mapping(uint256 => string) public holdNik;
    mapping(bytes32 => uint256) public tiketPerIdentitas;
    mapping(string => uint256) public kodeTiketToId;
    mapping(uint256 => TiketDetail) public daftarTiket;
    mapping(string => uint256) public tiketDibeliPerNIK;

    event TiketDibeli(uint256 indexed idTiket, bytes32 indexed nikHash, string kodeUnik);
    event TiketDigunakan(uint256 indexed idTiket, bytes32 indexed nikHash);
    event TiketDiHold(uint256 indexed holdId, uint256 jumlah);
    event TiketDilepas(uint256 indexed holdId);

    modifier hanyaPemilik() {
        require(
            msg.sender == owner,
            "Hanya pemilik acara yang dapat melakukan ini"
        );
        _;
    }

    constructor(
        uint256 _totalTiket,
        uint256 _maxTiketPerIdentitas,
        uint256 _hargaTiket
    ) {
        owner = msg.sender;
        totalTiket = _totalTiket;
        maxTiketPerIdentitas = _maxTiketPerIdentitas;
        tiketTerjual = 0;
        hargaTiket = _hargaTiket;
    }

    function hashNIK(string memory nik) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(nik));
    }

    function generateKodeUnik(
        uint256 idTiket,
        string memory nik
    ) private pure returns (string memory) {
        bytes32 nikHash = hashNIK(nik);
        return
            string(
                abi.encodePacked(
                    uint2str(uint256(nikHash)),
                    "-",
                    uint2str(idTiket)
                )
            );
    }

    function uint2str(uint256 _i) private pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            k = k - 1;
            bstr[k] = bytes1(uint8(48 + (j % 10)));
            j /= 10;
        }
        return string(bstr);
    }

    function holdTiketSementara(
        uint256 jumlahTiket
    ) public hanyaPemilik nonReentrant returns (uint256) {
        uint256 tiketDiHold = 0;
        for (uint256 i = 1; i < nextHoldId; i++) {
            if (holdTiketData[i].aktif) {
                tiketDiHold += holdTiketData[i].jumlahTiket;
            }
        }

        require(
            tiketTerjual + tiketDiHold + jumlahTiket <= totalTiket,
            "Jumlah tiket tidak tersedia"
        );
        require(
            jumlahTiket <= maxTiketPerIdentitas,
            "Jumlah tiket melebihi batas maksimum per identitas"
        );

        uint256 holdId = nextHoldId;
        holdTiketData[holdId] = HoldTiket(
            jumlahTiket,
            block.timestamp + holdDuration,
            true
        );
        nextHoldId++;

        emit TiketDiHold(holdId, jumlahTiket);
        return holdId;
    }

    function releaseHoldTiket(uint256 holdId) public hanyaPemilik nonReentrant {
        require(
            holdTiketData[holdId].aktif,
            "Hold ID tidak valid atau sudah dilepas"
        );
        // require(block.timestamp > holdTiketData[holdId].holdTimestamp, "Hold tiket masih berlaku");

        holdTiketData[holdId].aktif = false;
        emit TiketDilepas(holdId);
    }

    function beliTiket(
        uint256 holdId,
        string memory nik
    ) public hanyaPemilik nonReentrant {
        require(bytes(nik).length == 16, "NIK harus terdiri dari 16 digit");
        require(
            holdTiketData[holdId].aktif,
            "Hold ID tidak valid atau sudah dilepas"
        );

        bytes32 nikHash = hashNIK(nik);
        require(
            tiketPerIdentitas[nikHash] == 0,
            "Identitas ini sudah membeli tiket"
        );

        if (block.timestamp > holdTiketData[holdId].holdTimestamp) {
            holdTiketData[holdId].aktif = false;
            emit TiketDilepas(holdId);
            revert("Waktu hold tiket sudah habis dan tiket telah dilepas.");
        }

        uint256 jumlahTiket = holdTiketData[holdId].jumlahTiket;
        tiketPerIdentitas[nikHash] = jumlahTiket;

        for (uint256 i = 0; i < jumlahTiket; i++) {
            uint256 idTiket = tiketTerjual + 1;
            string memory kodeUnik = generateKodeUnik(idTiket, nik);
            daftarTiket[idTiket] = TiketDetail(nikHash, kodeUnik, false);
            kodeTiketToId[kodeUnik] = idTiket;
            tiketTerjual++;
            emit TiketDibeli(idTiket, nikHash, kodeUnik);
        }

        holdTiketData[holdId].aktif = false;
    }

    function gunakanTiket(
        string memory kodeTiket,
        string memory nik
    ) public hanyaPemilik nonReentrant {
        uint256 idTiket = kodeTiketToId[kodeTiket];
        require(idTiket != 0, "Tiket tidak ditemukan");
        require(!daftarTiket[idTiket].digunakan, "Tiket sudah digunakan");

        bytes32 nikHash = hashNIK(nik);
        require(
            daftarTiket[idTiket].nikHash == nikHash,
            "Identitas tidak sesuai"
        );

        daftarTiket[idTiket].digunakan = true;
        emit TiketDigunakan(idTiket, nikHash);
    }

    function cekTiket(
        string memory kodeTiket,
        string memory nik
    ) public view returns (bool, string memory) {
        uint256 idTiket = kodeTiketToId[kodeTiket];
        if (idTiket == 0) {
            return (false, "Tiket tidak ditemukan");
        }

        bytes32 nikHash = hashNIK(nik);
        if (daftarTiket[idTiket].nikHash == nikHash) {
            if (!daftarTiket[idTiket].digunakan) {
                return (true, "Tiket valid dan belum digunakan");
            } else {
                return (false, "Tiket valid dan sudah digunakan");
            }
        } else {
            return (false, "Tiket tidak valid");
        }
    }

    function tiketTersedia() public view returns (uint256) {
        uint256 tiketDiHold;
        for (uint256 i = 1; i < nextHoldId; i++) {
            if (holdTiketData[i].aktif) {
                tiketDiHold += holdTiketData[i].jumlahTiket;
            }
        }
        return totalTiket - tiketTerjual - tiketDiHold;
    }

    function getTiketDiHold() public view returns (uint256) {
        uint256 tiketDiHold;
        for (uint256 i = 1; i < nextHoldId; i++) {
            if (holdTiketData[i].aktif) {
                tiketDiHold += holdTiketData[i].jumlahTiket;
            }
        }

        return tiketDiHold;
    }

    function getHargaTiket() public view returns (uint256) {
        return hargaTiket;
    }
}
