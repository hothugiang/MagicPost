import { Table, Button, Space, Descriptions, Input, Form } from "antd";
import PropTypes from "prop-types";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import SkeletonTable from "../components/SkeletonTable";
import service from "../helpers/service";
import axios from "axios";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import moment from "moment";
import {
  EE_ROLE,
  EM_ROLE,
  GE_ROLE,
  GM_ROLE,
  IN_PROGRESS_STATE,
  LEADER_ROLE,
  REJECTED_STATE,
  SUCCESS_STATE,
} from "../helpers/constants";

export default function PackageManagement(props: any) {
  const { role } = props;
  const [roleAPI, setRoleAPI] = useState("");

  const [sentPackages, setSentPackages] = useState([]);
  const [receivedPackages, setReceivedPackages] = useState([]);
  const [allPackage, setAllPackage] = useState([]);

  const [totalCount, setTotalCount] = useState(0);
  const [successfulCount, setSuccessfulCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);

  const [searchByLeader, setSearchByLeader] = useState({
    dataIndex: "",
    searchText: "",
  });
  const idSearchInputByLeader = useRef(null);
  const [currentPageOfAll, setCurrentPageOfAll] = useState(1);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (role === EE_ROLE) {
      setRoleAPI("/ex-employee");
    } else if (role === GE_ROLE) {
      setRoleAPI("/gth-employee");
    } else if (role === LEADER_ROLE) {
      setRoleAPI("/leader");
    } else if (role === EM_ROLE) {
      setRoleAPI("/ex-manager");
    } else if (role === GM_ROLE) {
      setRoleAPI("/gth-manager");
    }

    if (roleAPI && role !== LEADER_ROLE) {
      axios
        .all([
          service.get(roleAPI + `/sent-packages`),
          service.get(roleAPI + `/received-packages`),
        ])
        .then(
          axios.spread((res1, res2) => {
            const newData1 = res1.data.results.map((item: { id: any }) => ({
              ...item,
              key: item.id,
            }));
            setSentPackages(newData1);
            const newData2 = res2.data.results.map((item: { id: any }) => ({
              ...item,
              key: item.id,
            }));
            setReceivedPackages(newData2);
            setLoading(false);
          }),
          () => {
            setLoading(false);
            toast.error("Something went wrong");
          },
        )
        .catch((err) => {
          setLoading(false);
          toast.error(err.response.data.message);
        });
      setCurrentPage(1);
    } else if (roleAPI && role === LEADER_ROLE) {
      service.get(roleAPI + `/all-packages`).then((res) => {
        let totalCount = 0;
        let successfulCount = 0;
        let rejectedCount = 0;
        let inProgressCount = 0;

        const newData = res.data.results.map((item: any) => {
          switch (item.generalState) {
            case SUCCESS_STATE:
              successfulCount++;
              break;
            case REJECTED_STATE:
              rejectedCount++;
              break;
            case IN_PROGRESS_STATE:
              inProgressCount++;
              break;
            default:
              break;
          }

          return {
            ...item,
            key: item.id,
          };
        });

        totalCount = successfulCount + rejectedCount + inProgressCount;
        setAllPackage(newData);
        setLoading(false);

        setTotalCount(totalCount);
        setSuccessfulCount(successfulCount);
        setRejectedCount(rejectedCount);
        setInProgressCount(inProgressCount);
      });
    }
  }, [role, roleAPI]);

  // Search in allPackage
  const handleSearchByLeader = (
    selectedKeys: any[],
    confirm: () => void,
    dataIndex: string,
  ) => {
    confirm();
    setSearchByLeader({ dataIndex, searchText: selectedKeys[0] });

    // Get index of searched data's list
    const dataIndexIndex = allPackage.findIndex(
      (item) => item[dataIndex] === selectedKeys[0],
    );

    // Check if it is founded
    if (dataIndexIndex !== -1) {
      const searchedPage = Math.ceil((dataIndexIndex + 1) / 5);

      // Update current page
      setCurrentPageOfAll(searchedPage);
    }
  };
  const handleResetIdByLeader = (clearFilters: () => void) => {
    clearFilters();
    setSearchByLeader({ ...searchByLeader, searchText: "" });
  };
  const getColumnSearchPropsByLeader = (dataIndex: string) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }: {
      setSelectedKeys: (keys: string[]) => void;
      selectedKeys: string[];
      confirm: () => void;
      clearFilters: () => void;
      close: () => void;
    }) => (
      <div className="p-2">
        <Input
          ref={dataIndex === "id" ? idSearchInputByLeader : null}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearchByLeader(selectedKeys, confirm, dataIndex)
          }
          className="mb-4 block"
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearchByLeader(selectedKeys, confirm, dataIndex)
            }
            icon={<SearchOutlined />}
            size="small"
            className="w-[90px]"
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleResetIdByLeader(clearFilters)}
            size="small"
            className="w-[90px]"
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            Close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: any) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1890ff" : undefined,
        }}
      />
    ),
    onFilterDropdownOpenChange: (visible: any) => {
      if (visible) {
        setTimeout(
          () => (dataIndex === "id" ? idSearchInputByLeader : null)?.select(),
          100,
        );
      }
    },
    render: (text: { toString: () => string }) =>
      searchByLeader.dataIndex === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchByLeader.searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const pagination = {
    hideOnSinglePage: true,
    pageSize: 5,
    current: currentPage,
    showTotal: (total: number, range: number[]) =>
      `${range[0]}-${range[1]} of ${total} items`,
  };

  const paginationOfAll = {
    current: currentPageOfAll,
    defaultPageSize: 5,
    showSizeChanger: true,
    pageSizeOptions: ["5", "10", "20", "30"],
    showTotal: (total: number, range: number[]) =>
      `${range[0]}-${range[1]} of ${total} items`,
  };

  const columns = [
    {
      title: "Package ID",
      dataIndex: "id",
      key: "id",
      width: "10%",
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: "20%",
      render: (text: any, record: any) => (
        <>
          {record.timestamp
            ? moment(record.timestamp).format("DD-MM-YYYY [at] HH:mm")
            : null}
        </>
      ),
    },
    {
      title: "Last Status",
      dataIndex: "status",
      key: "status",
      width: "55%",
    },
    {
      title: "State",
      key: "state",
      width: "15%",
      filters: [
        {
          text: "Sent",
          value: "sent",
        },
        {
          text: "Received",
          value: "received",
        },
      ],
      onFilter: (value: any, record: any) =>
        record.source.indexOf(value) === 0,
        
      render: (text: any, record: any) => (
        <>
          {(record.source === "sent") ? (
            <div className="rounded-lg bg-[#ffb1c2] px-2 py-1 text-center font-bold">
              Sent
            </div>
          ):(
            <div className="rounded-lg bg-[#9bd1f5] px-2 py-1 text-center font-bold">
              Received
            </div>
          )}
        </>
      )
    }
  ];

  const columnsAll = [
    {
      title: "Package ID",
      dataIndex: "id",
      key: "id",
      ...getColumnSearchPropsByLeader("id"),
    },
    {
      title: "Sender Name",
      dataIndex: "senderName",
      key: "senderName",
      sorter: (a: { senderName: string }, b: { senderName: any }) =>
        a.senderName.localeCompare(b.senderName),
    },
    {
      title: "Receiver Name",
      dataIndex: "receiverName",
      key: "receiverName",
      sorter: (c: { receiverName: string }, d: { receiverName: any }) =>
        c.receiverName.localeCompare(d.receiverName),
    },
    {
      title: "Package Type",
      dataIndex: "packageType",
      key: "packageType",
      filters: [
        {
          text: "GOODS",
          value: "GOODS",
        },
        {
          text: "DOCUMENT",
          value: "DOCUMENT",
        },
      ],
      onFilter: (value: any, record: any) =>
        record.packageType.indexOf(value) === 0,
    },
    {
      title: "State",
      dataIndex: "generalState",
      key: "generalState",
      filters: [
        {
          text: "Success",
          value: SUCCESS_STATE,
        },
        {
          text: "Rejected",
          value: REJECTED_STATE,
        },
        {
          text: "In Progress",
          value: IN_PROGRESS_STATE,
        },
      ],
      onFilter: (value: any, record: any) =>
        record.generalState.indexOf(value) === 0,
      render: (text: any, record: any) => (
        <>
          {record.generalState === SUCCESS_STATE ? (
            <div className="rounded-lg bg-[#9bd1f5] px-2 py-1 text-center font-bold">
              Success
            </div>
          ) : record.generalState === REJECTED_STATE ? (
            <div className="rounded-lg bg-[#ffb1c2] px-2 py-1 text-center font-bold">
              Rejected
            </div>
          ) : (
            <div className="rounded-lg bg-[#ffe6ab] px-2 py-1 text-center font-bold">
              In Progress
            </div>
          )}
        </>
      ),
      width: "10rem",
    },
  ];

  type PackageDetail = {
    key: number;
    label: string;
    children: React.ReactNode;
    span: number;
  };

  const packageDetailSent = (pkg: any): PackageDetail[] => [
    {
      key: 1,
      label: "senderName",
      children: pkg.senderName,
      span: 1.5,
    },
    {
      key: 2,
      label: "receiverName",
      children: pkg.receiverName,
      span: 1.5,
    },
    {
      key: 3,
      label: "senderContact",
      children: pkg.senderContact,
      span: 1.5,
    },
    {
      key: 4,
      label: "receiverContact",
      children: pkg.receiverContact,
      span: 1.5,
    },
    {
      key: 5,
      label: "orgAddress",
      children: pkg.orgAddress,
      span: 1.5,
    },
    {
      key: 6,
      label: "desAddress",
      children: pkg.desAddress,
      span: 1.5,
    },
    {
      key: 7,
      label: "packageType",
      children: pkg.packageType,
      span: 1.5,
    },
    {
      key: 8,
      label: "weight (kg)",
      children: pkg.weight,
      span: 1.5,
    },
    {
      key: 9,
      label: "lastStatus",
      children: pkg.status[pkg.status.length - 1]
        ? pkg.status[pkg.status.length - 1].detail
        : "",
      span: 3,
    },
  ];

  const packageDetailReceived = (pkg: any): PackageDetail[] => [
    {
      key: 1,
      label: "senderName",
      children: pkg.senderName,
      span: 1.5,
    },
    {
      key: 2,
      label: "receiverName",
      children: pkg.receiverName,
      span: 1.5,
    },
    {
      key: 3,
      label: "senderContact",
      children: pkg.senderContact,
      span: 1.5,
    },
    {
      key: 4,
      label: "receiverContact",
      children: pkg.receiverContact,
      span: 1.5,
    },
    {
      key: 5,
      label: "orgAddress",
      children: pkg.orgAddress,
      span: 1.5,
    },
    {
      key: 6,
      label: "desAddress",
      children: pkg.desAddress,
      span: 1.5,
    },
    {
      key: 7,
      label: "packageType",
      children: pkg.packageType,
      span: 1.5,
    },
    {
      key: 8,
      label: "weight (kg)",
      children: pkg.weight,
      span: 1.5,
    },
    {
      key: 9,
      label: "lastStatus",
      children: pkg.status[pkg.status.length - 1]
        ? pkg.status[pkg.status.length - 1].detail
        : "",
      span: 3,
    },
  ];

  const packageDetailAll = (pkg: any): PackageDetail[] => [
    {
      key: 1,
      label: "senderName",
      children: pkg.senderName,
      span: 1.5,
    },
    {
      key: 2,
      label: "receiverName",
      children: pkg.receiverName,
      span: 1.5,
    },
    {
      key: 3,
      label: "senderContact",
      children: pkg.senderContact,
      span: 1.5,
    },
    {
      key: 4,
      label: "receiverContact",
      children: pkg.receiverContact,
      span: 1.5,
    },
    {
      key: 5,
      label: "orgAddress",
      children: pkg.orgAddress,
      span: 1.5,
    },
    {
      key: 6,
      label: "desAddress",
      children: pkg.desAddress,
      span: 1.5,
    },
    {
      key: 7,
      label: "packageType",
      children: pkg.packageType,
      span: 1.5,
    },
    {
      key: 8,
      label: "weight (kg)",
      children: pkg.weight,
      span: 1.5,
    },
    {
      key: 9,
      label: "lastStatus",
      children: pkg.status[pkg.status.length - 1]
        ? pkg.status[pkg.status.length - 1].detail
        : "",
      span: 3,
    },
  ];

  const dataSent = sentPackages.map((pkg: any) => ({
    key: pkg.id,
    id: pkg.id,
    senderName: pkg.senderName,
    timestamp: pkg.timestamp,
    status: pkg.status[pkg.status.length - 1].detail,
    description: (
      <Descriptions size="small" bordered items={packageDetailSent(pkg)} />
    ),
    source: 'sent',
  }));

  const dataReceived = receivedPackages.map((pkg: any) => ({
    key: pkg.id,
    id: pkg.id,
    senderName: pkg.senderName,
    timestamp: pkg.timestamp,
    status: pkg.status[pkg.status.length - 1].detail,
    description: (
      <Descriptions size="small" bordered items={packageDetailReceived(pkg)} />
    ),
    source: 'received',
  }));

  const dataOfAll = allPackage.map((pkg: any) => ({
    key: pkg.id,
    id: pkg.id,
    senderName: pkg.senderName,
    receiverName: pkg.receiverName,
    packageType: pkg.packageType,
    orgPointId: pkg.orgPointId,
    desPointId: pkg.orgPointId,
    generalState: pkg.generalState,
    description: (
      <Descriptions size="small" bordered items={packageDetailAll(pkg)} />
    ),
  }));

  const historyData = [...dataSent, ...dataReceived].map((item, index) => ({
    ...item,
    key: index,
  }));

  historyData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  //Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState([]);

  const [searchQueryByLeader, setSearchQueryByLeader] = useState('');
  const [searchResultByLeader, setSearchResultByLeader] = useState([]);

  
  if (role === LEADER_ROLE) {
    useEffect(() => {
      const resultsByLeader = dataOfAll.filter((item) =>
      item.id.toString().includes(searchQuery)
      );
      
      if (resultsByLeader.length !== searchResultByLeader.length) {
        setSearchResultByLeader(resultsByLeader);
      }
    }, [searchQueryByLeader, dataOfAll, searchResultByLeader]);
  } else if (role !== LEADER_ROLE) {
    useEffect(() => {
      const results = historyData.filter((item) =>
        item.id.toString().includes(searchQuery)
      );
    
      if (results.length !== searchResult.length) {
        setSearchResult(results);
      }
    }, [searchQuery, historyData, searchResult]);
  }

  return (
    <>
      <div className="flex justify-center pb-4">
        {role !== LEADER_ROLE && (
          <div className="w-full">
            <div className="mb-4 ml-3 text-3xl font-bold">Packages History</div>
            <div className="rounded-xl w-[97] bg-white p-3 shadow-lg min-h-[78%]">
              <Form className="flex items-center justify-center mt-1">
                <Form.Item className="basis-[90%] mx-auto md:basis-[60%] xl:basis-[40%]">
                  <Input
                    placeholder="Package ID"
                    className="px-2 py-1 text-lg"
                    suffix={
                      <div className="rounded-l px-2 py-1">
                        <SearchOutlined className="transition-all duration-300" />
                      </div>
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  ></Input>
                </Form.Item>
              </Form>
              
              <SkeletonTable loading={loading} columns={columns}>
                <Table
                  scroll={{ x: 1200 }}
                  className="w-full"
                  columns={columns}
                  expandable={{
                    expandedRowRender: (record) => (
                      <p style={{ margin: 0 }}>{record.description}</p>
                    ),
                    rowExpandable: (record) => record.description !== "",
                  }}
                  dataSource={searchResult}
                  pagination={pagination}
                  onChange={(pagination) =>
                    setCurrentPage(pagination.current)
                  }
                />
              </SkeletonTable>
            </div>
          </div>
        )}

        {role === LEADER_ROLE && (
          <div className="w-full">
            <div className="mb-4 ml-3 text-3xl font-bold">All Packages</div>
            <div className="mb-4 flex w-full flex-wrap justify-evenly">
              <div className="flex basis-[98%] items-center gap-3 bg-white px-5 py-3 shadow-lg sm:basis-[45%] xl:basis-[23%]">
                <img src="/src/assets/total.svg" width={70} height={70} />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">{totalCount}</span>
                  <span className="text-sm">Total</span>
                </div>
              </div>
              <div className="flex basis-[98%] items-center gap-3 bg-white px-5 py-3 shadow-lg sm:basis-[45%] xl:basis-[23%]">
                <img src="/src/assets/successful.svg" width={70} height={70} />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">{successfulCount}</span>
                  <span className="text-sm">Successful</span>
                </div>
              </div>
              <div className="flex basis-[98%] items-center gap-3 bg-white px-5 py-3 shadow-lg sm:basis-[45%] xl:basis-[23%]">
                <img src="/src/assets/rejected.svg" width={70} height={70} />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">{rejectedCount}</span>
                  <span className="text-sm">Rejected</span>
                </div>
              </div>
              <div className="flex basis-[98%] items-center gap-3 bg-white px-5 py-3 shadow-lg sm:basis-[45%] xl:basis-[23%]">
                <img src="/src/assets/inprogress.svg" width={70} height={70} />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold">{inProgressCount}</span>
                  <span className="text-sm">In Progress</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 shadow-lg">
              <Form className="flex items-center justify-center mt-1">
                <Form.Item className="basis-[90%] mx-auto md:basis-[60%] xl:basis-[40%]">
                  <Input
                    placeholder="Package ID"
                    className="px-2 py-1 text-lg"
                    suffix={
                      <div className="rounded-l px-2 py-1">
                        <SearchOutlined className="transition-all duration-300" />
                      </div>
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQueryByLeader(e.target.value)}
                  ></Input>
                </Form.Item>
              </Form>
              
              <SkeletonTable loading={loading} columns={columnsAll}>
                <Table
                  scroll={{ x: 800 }}
                  className="w-full"
                  columns={columnsAll}
                  expandable={{
                    expandedRowRender: (record) => (
                      <p style={{ margin: 0 }}>{record.description}</p>
                    ),
                    rowExpandable: (record) => record.description !== "",
                  }}
                  dataSource={searchResultByLeader}
                  pagination={paginationOfAll}
                  idSearchInput={idSearchInputByLeader}
                  onChange={(pagination) =>
                    setCurrentPageOfAll(pagination.current)
                  }
                />
              </SkeletonTable>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

PackageManagement.propTypes = {
  role: PropTypes.string,
};
